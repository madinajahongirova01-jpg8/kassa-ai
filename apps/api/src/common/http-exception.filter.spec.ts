import { BadRequestException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('keeps client error messages and validation details', () => {
    const exception = new BadRequestException({ message: 'Validation failed', details: ['email is invalid'] });

    expect(filter.toErrorResponse(exception)).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: ['email is invalid'],
    });
  });

  it('maps simple HttpExceptions', () => {
    expect(filter.toErrorResponse(new ConflictException('Email taken'))).toEqual({
      statusCode: 409,
      error: 'Conflict',
      message: 'Email taken',
    });
  });

  it('hides internal details of unknown errors', () => {
    const body = filter.toErrorResponse(new Error('password_hash column leaked: secret-value'));

    expect(body).toEqual({ statusCode: 500, error: 'Internal Server Error', message: 'Internal server error' });
    expect(JSON.stringify(body)).not.toContain('secret-value');
  });

  it('hides messages of 5xx HttpExceptions', () => {
    const body = filter.toErrorResponse(new InternalServerErrorException('db credentials: secret-value'));

    expect(body.message).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('secret-value');
  });

  it('maps body-parser errors to a generic client error', () => {
    const parseError = Object.assign(new SyntaxError('Unexpected token } in JSON at position 10'), {
      status: 400,
      expose: true,
      type: 'entity.parse.failed',
    });

    expect(filter.toErrorResponse(parseError)).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Malformed request',
    });
  });
});
