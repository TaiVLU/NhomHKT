import { createHash } from 'node:crypto';
import { Router } from 'express';
import type { Request, Response } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import type { Environment } from '../../config/environment.js';
import { authCsrf } from '../../middlewares/auth-csrf.js';
import { authenticate, getPrincipal } from '../../middlewares/authenticate.js';
import { validateBody } from '../../middlewares/validate.js';
import { requirePermission } from '../../middlewares/authorize.js';
import { AppError } from '../../shared/errors/app-error.js';
import { REFRESH_COOKIE_NAME, REFRESH_TOKEN_TTL_SECONDS } from './auth.constants.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from './auth.schema.js';
import type { AuthService, RequestContext } from './auth.service.js';

const contextOf = (request: Request, response: Response): RequestContext => ({
  ip: request.ip,
  userAgent: request.header('user-agent'),
  requestId: response.locals.requestId as string,
});
const cookieOptions = (environment: Environment) => ({
  httpOnly: true,
  secure: environment.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
});
const identifierKey = (request: Request): string => {
  const body: unknown = request.body;
  const record = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const identifier =
    typeof record.username === 'string'
      ? record.username
      : typeof record.email === 'string'
        ? record.email
        : '';
  return `${ipKeyGenerator(request.ip ?? 'unknown')}:${createHash('sha256').update(identifier).digest('hex')}`;
};
const refreshCookie = (request: Request): string | undefined => {
  const cookies: unknown = request.cookies;
  if (typeof cookies !== 'object' || cookies === null) return undefined;
  const value = (cookies as Record<string, unknown>)[REFRESH_COOKIE_NAME];
  return typeof value === 'string' ? value : undefined;
};
const refreshKey = (request: Request): string =>
  `${ipKeyGenerator(request.ip ?? 'unknown')}:${createHash('sha256')
    .update(refreshCookie(request) ?? '')
    .digest('hex')}`;
const limiter = (limit: number, windowMs: number, keyGenerator?: (request: Request) => string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Vui lòng thử lại sau.' } },
  });

export const createAuthRouter = (service: AuthService, environment: Environment): Router => {
  const router = Router();
  const setSession = (
    response: Response,
    result: Awaited<ReturnType<AuthService['login']>>,
    status = 200,
  ): void => {
    response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions(environment));
    response.status(status).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
      requestId: response.locals.requestId as string,
    });
  };
  router.post(
    '/register',
    limiter(5, 15 * 60_000),
    validateBody(registerSchema),
    async (request, response) =>
      setSession(
        response,
        await service.register(registerSchema.parse(request.body), contextOf(request, response)),
        201,
      ),
  );
  router.post(
    '/login',
    limiter(10, 15 * 60_000, identifierKey),
    validateBody(loginSchema),
    async (request, response) =>
      setSession(
        response,
        await service.login(loginSchema.parse(request.body), false, contextOf(request, response)),
      ),
  );
  router.post(
    '/admin/login',
    limiter(5, 15 * 60_000, identifierKey),
    validateBody(loginSchema),
    async (request, response) =>
      setSession(
        response,
        await service.login(loginSchema.parse(request.body), true, contextOf(request, response)),
      ),
  );
  router.post(
    '/refresh',
    limiter(30, 15 * 60_000, refreshKey),
    authCsrf(environment),
    async (request, response) => {
      const raw = refreshCookie(request);
      if (!raw) throw new AppError(401, 'AUTH_REFRESH_INVALID', 'Phiên đăng nhập không hợp lệ.');
      setSession(response, await service.refresh(raw, contextOf(request, response)));
    },
  );
  router.post('/logout', authCsrf(environment), async (request, response) => {
    await service.logout(refreshCookie(request));
    response.clearCookie(REFRESH_COOKIE_NAME, cookieOptions(environment));
    response.status(204).end();
  });
  router.post(
    '/forgot-password',
    limiter(3, 15 * 60_000, identifierKey),
    validateBody(forgotPasswordSchema),
    async (request, response) => {
      const input = forgotPasswordSchema.parse(request.body);
      await service.forgotPassword(input.email, contextOf(request, response));
      response.json({
        success: true,
        data: { message: 'Nếu email tồn tại, hướng dẫn đã được gửi.' },
        requestId: response.locals.requestId as string,
      });
    },
  );
  router.post(
    '/verify-otp',
    limiter(5, 10 * 60_000, identifierKey),
    validateBody(verifyOtpSchema),
    async (request, response) => {
      const input = verifyOtpSchema.parse(request.body);
      response.json({
        success: true,
        data: { resetToken: await service.verifyOtp(input.email, input.otp) },
        requestId: response.locals.requestId as string,
      });
    },
  );
  router.post('/reset-password', validateBody(resetPasswordSchema), async (request, response) => {
    const input = resetPasswordSchema.parse(request.body);
    await service.resetPassword(input.resetToken, input.newPassword, contextOf(request, response));
    response.json({
      success: true,
      data: { message: 'Mật khẩu đã được đặt lại.' },
      requestId: response.locals.requestId as string,
    });
  });
  router.get('/session', authenticate(service.tokens), async (_request, response) =>
    response.json({
      success: true,
      data: { user: await service.session(getPrincipal(response).userId) },
      requestId: response.locals.requestId as string,
    }),
  );
  return router;
};

export const createMeAuthRouter = (service: AuthService, environment: Environment): Router => {
  const router = Router();
  router.patch(
    '/password',
    authenticate(service.tokens),
    requirePermission('PROFILE_SELF'),
    validateBody(changePasswordSchema),
    async (request, response) => {
      const input = changePasswordSchema.parse(request.body);
      const result = await service.changePassword(
        getPrincipal(response).userId,
        input.currentPassword,
        input.newPassword,
        contextOf(request, response),
      );
      response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions(environment));
      response.json({
        success: true,
        data: { user: result.user, accessToken: result.accessToken },
        requestId: response.locals.requestId as string,
      });
    },
  );
  return router;
};
