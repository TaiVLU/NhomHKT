import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD.');

const validCalendarDate = (value: string): boolean => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const dayNumber = (value: string): number =>
  Math.floor(new Date(`${value}T00:00:00.000Z`).getTime() / 86_400_000);

export const reportingRangeSchema = z
  .strictObject({
    from: dateOnly.refine(validCalendarDate, 'Invalid from date.').optional(),
    to: dateOnly.refine(validCalendarDate, 'Invalid to date.').optional(),
  })
  .refine((value) => Boolean(value.from) === Boolean(value.to), {
    message: 'from and to must be supplied together.',
  })
  .refine((value) => !value.from || !value.to || dayNumber(value.from) <= dayNumber(value.to), {
    message: 'from must be before or equal to to.',
  })
  .refine(
    (value) => !value.from || !value.to || dayNumber(value.to) - dayNumber(value.from) + 1 <= 366,
    { message: 'Reporting ranges are limited to 366 days.' },
  );

export type ReportingRangeInput = z.infer<typeof reportingRangeSchema>;
