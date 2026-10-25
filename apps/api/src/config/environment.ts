import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().min(1).default('127.0.0.1'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  TRUST_PROXY_HOPS: z
    .enum(['0', '1'])
    .default('0')
    .transform((value): 0 | 1 => (value === '1' ? 1 : 0)),
  WEB_ORIGIN: z.url(),
  DATABASE_URL: z.string().min(1).startsWith('sqlserver://'),
  JWT_SECRET: z.string().refine((value) => Buffer.byteLength(value, 'utf8') >= 32, 'min 32 bytes'),
  JWT_ISSUER: z.string().min(1).default('hktstore-api'),
  JWT_AUDIENCE: z.string().min(1).default('hktstore-web'),
  OTP_PEPPER: z.string().refine((value) => Buffer.byteLength(value, 'utf8') >= 32, 'min 32 bytes'),
  MAIL_MODE: z.enum(['fake', 'smtp']).default('fake'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.stringbool().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.email().default('no-reply@hktstore.local'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  CLOUDINARY_PRODUCT_FOLDER: z.string().min(1).optional(),
  PRODUCT_IMAGE_ADAPTER: z.enum(['cloudinary', 'fake']).default('cloudinary'),
});

type ParsedEnvironment = z.infer<typeof environmentSchema>;

export type Environment = Omit<ParsedEnvironment, 'TRUST_PROXY_HOPS'> & {
  /** Explicitly enabled only for a verified one-hop reverse-proxy topology. */
  TRUST_PROXY_HOPS?: 0 | 1;
};

export const parseEnvironment = (source: NodeJS.ProcessEnv): Environment => {
  const result = environmentSchema.safeParse(source);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.') || 'environment');
    throw new Error(`Invalid environment configuration: ${[...new Set(fields)].join(', ')}`);
  }
  if (result.data.MAIL_MODE === 'smtp' && !result.data.SMTP_HOST) {
    throw new Error('Invalid environment configuration: SMTP_HOST');
  }
  return result.data;
};