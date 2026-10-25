import { z } from 'zod';

export const CHATBOT_MESSAGE_MAX = 500;

const normalizedText = (max: number) =>
  z
    .string()
    .transform((value) => value.trim().replace(/\s+/gu, ' '))
    .pipe(z.string().min(1).max(max));

const filterText = normalizedText(200).nullable().optional();

const unsafeMessagePattern =
  /(?:https?:\/\/|\b(?:select\s+.+\s+from|insert\s+into|update\s+.+\s+set|delete\s+from|drop\s+(?:table|database)|union\s+select)\b|\b(?:customer|cart|order|account|user|variant|product)(?:_|-)?id\b|\bbearer\s+[a-z0-9._~-]+)/iu;

export const chatbotSearchSchema = z
  .object({
    message: normalizedText(CHATBOT_MESSAGE_MAX).optional(),
    filters: z
      .object({
        category: filterText,
        author: filterText,
        publisher: filterText,
        minPrice: z.number().int().safe().nonnegative().nullable().optional(),
        maxPrice: z.number().int().safe().nonnegative().nullable().optional(),
        availableOnly: z.boolean().optional(),
      })
      .strict()
      .optional(),
    source: z.enum(['TYPEBOT']),
  })
  .strict()
  .superRefine((value, context) => {
    const filters = value.filters;
    const hasFilter = Boolean(
      filters &&
      (filters.category ||
        filters.author ||
        filters.publisher ||
        filters.minPrice != null ||
        filters.maxPrice != null ||
        filters.availableOnly !== undefined),
    );
    if (!value.message && !hasFilter)
      context.addIssue({ code: 'custom', message: 'A meaningful message or filter is required.' });
    if (value.message && unsafeMessagePattern.test(value.message))
      context.addIssue({ code: 'custom', message: 'The message contains unsupported input.' });
    if (
      filters?.minPrice != null &&
      filters?.maxPrice != null &&
      filters.minPrice > filters.maxPrice
    )
      context.addIssue({ code: 'custom', message: 'minPrice must not exceed maxPrice.' });
  });

export type ChatbotSearchInput = z.infer<typeof chatbotSearchSchema>;
