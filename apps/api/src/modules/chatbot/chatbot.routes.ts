import { Router, type RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { CatalogService } from '../catalog/catalog.service.js';
import { AppError } from '../../shared/errors/app-error.js';
import { CHATBOT_MESSAGE_MAX, chatbotSearchSchema } from './chatbot.schema.js';
import { ChatbotService } from './chatbot.service.js';

const validateChatbotBody: RequestHandler = (request, _response, next) => {
  const body: unknown = request.body;
  const rawMessage =
    typeof body === 'object' && body !== null && 'message' in body ? body.message : undefined;
  if (typeof rawMessage === 'string' && rawMessage.trim().length > CHATBOT_MESSAGE_MAX)
    return next(
      new AppError(400, 'CHATBOT_MESSAGE_TOO_LONG', 'Tin nhắn vượt quá độ dài cho phép.'),
    );
  const result = chatbotSearchSchema.safeParse(body);
  if (!result.success)
    return next(new AppError(400, 'CHATBOT_INVALID_INPUT', 'Yêu cầu chatbot chưa hợp lệ.'));
  request.body = result.data;
  next();
};

export const createChatbotRouter = (catalog: CatalogService, origin: string): Router => {
  const router = Router();
  const service = new ChatbotService(catalog, origin);
  router.post(
    '/search',
    rateLimit({
      windowMs: 60_000,
      limit: 30,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_request, response) =>
        response.status(429).json({
          success: false,
          error: {
            code: 'CHATBOT_RATE_LIMITED',
            message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
          },
          requestId: response.locals.requestId as string,
        }),
    }),
    validateChatbotBody,
    async (request, response) =>
      response.json({
        success: true,
        data: await service.search(chatbotSearchSchema.parse(request.body as unknown)),
        requestId: response.locals.requestId as string,
      }),
  );
  return router;
};
