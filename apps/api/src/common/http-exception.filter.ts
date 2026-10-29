import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { STATUS_CODES } from 'node:http';
import { ErrorResponse } from './error-response';

interface ExposedHttpError {
  status: number;
  expose: true;
}

function isExposedClientError(exception: unknown): exception is ExposedHttpError {
  if (typeof exception !== 'object' || exception === null) {
    return false;
  }
  const candidate = exception as Partial<Record<'status' | 'expose', unknown>>;
  return (
    candidate.expose === true &&
    typeof candidate.status === 'number' &&
    candidate.status >= 400 &&
    candidate.status < 500
  );
}

function statusName(status: number): string {
  return STATUS_CODES[status] ?? 'Error';
}

function fromHttpException(exception: HttpException): ErrorResponse {
  const status = exception.getStatus();
  if (status >= 500) {
    return {
      statusCode: status,
      error: statusName(status),
      message: 'Internal server error',
    };
  }

  const response: ErrorResponse = {
    statusCode: status,
    error: statusName(status),
    message: exception.message,
  };

  const body = exception.getResponse();
  if (typeof body === 'object' && body !== null) {
    const { message, details } = body as Partial<Record<'message' | 'details', unknown>>;
    if (typeof message === 'string') {
      response.message = message;
    }
    if (Array.isArray(details) && details.every((item) => typeof item === 'string')) {
      response.details = details;
    }
  }

  return response;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toErrorResponse(exception);
    response.status(body.statusCode).json(body);
  }

  toErrorResponse(exception: unknown): ErrorResponse {
    if (exception instanceof HttpException) {
      const body = fromHttpException(exception);
      if (body.statusCode >= 500) {
        this.logger.error(exception.message, exception.stack);
      }
      return body;
    }

    if (isExposedClientError(exception)) {
      return {
        statusCode: exception.status,
        error: statusName(exception.status),
        message: 'Malformed request',
      };
    }

    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error('Unhandled exception', stack);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: statusName(HttpStatus.INTERNAL_SERVER_ERROR),
      message: 'Internal server error',
    };
  }
}
