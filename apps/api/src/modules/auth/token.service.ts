import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Environment } from '../../config/environment.js';
import { AppError } from '../../shared/errors/app-error.js';
import { ACCESS_TOKEN_TTL_SECONDS } from './auth.constants.js';

export interface AccessPrincipal {
  sub: string;
  role: string;
  sid: string;
  jti: string;
}

export class TokenService {
  constructor(private readonly environment: Environment) {}

  signAccessToken(userId: bigint, role: string, familyId: string): string {
    return jwt.sign({ role, sid: familyId }, this.environment.JWT_SECRET, {
      algorithm: 'HS256',
      subject: userId.toString(),
      jwtid: randomUUID(),
      issuer: this.environment.JWT_ISSUER,
      audience: this.environment.JWT_AUDIENCE,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  verifyAccessToken(token: string): AccessPrincipal {
    try {
      const payload = jwt.verify(token, this.environment.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: this.environment.JWT_ISSUER,
        audience: this.environment.JWT_AUDIENCE,
      });
      if (
        typeof payload === 'string' ||
        !payload.sub ||
        typeof payload.role !== 'string' ||
        typeof payload.sid !== 'string' ||
        !payload.jti
      )
        throw new Error('claims');
      return { sub: payload.sub, role: payload.role, sid: payload.sid, jti: payload.jti };
    } catch {
      throw new AppError(401, 'AUTH_UNAUTHORIZED', 'Phiên đăng nhập không hợp lệ.');
    }
  }
}
