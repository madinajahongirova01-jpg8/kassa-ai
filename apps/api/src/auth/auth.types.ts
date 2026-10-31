import { Request } from 'express';

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  businessName: string | null;
  createdAt: Date;
}

export interface AuthResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: PublicUser;
}

export interface JwtPayload {
  sub: string;
  iat: number;
}

export interface ChangePasswordResult extends AuthResult {
  changed: true;
}

export interface AuthenticatedRequest extends Request {
  user: PublicUser;
}
