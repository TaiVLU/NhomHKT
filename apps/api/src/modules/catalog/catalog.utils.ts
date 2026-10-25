import { AppError } from '../../shared/errors/app-error.js';

export const normalizeWhitespace = (value: string): string => value.trim().replace(/\s+/g, ' ');
export const slugify = (value: string): string =>
  normalizeWhitespace(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255);
export const parseId = (value: string): bigint => {
  if (!/^[1-9]\d*$/.test(value)) throw new AppError(400, 'VALIDATION_ERROR', 'ID không hợp lệ.');
  return BigInt(value);
};
export const normalizeIsbn = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const isbn = input.replace(/[\s-]/g, '').toUpperCase();
  const valid10 =
    /^\d{9}[\dX]$/.test(isbn) &&
    [...isbn].reduce(
      (sum, char, index) => sum + (char === 'X' ? 10 : Number(char)) * (10 - index),
      0,
    ) %
      11 ===
      0;
  const valid13 =
    /^\d{13}$/.test(isbn) &&
    [...isbn].reduce((sum, char, index) => sum + Number(char) * (index % 2 === 0 ? 1 : 3), 0) %
      10 ===
      0;
  if (!valid10 && !valid13) throw new AppError(400, 'CATALOG_INVALID_ISBN', 'ISBN không hợp lệ.');
  return isbn;
};
export const decimalNumber = (value: { toString(): string }): number => {
  const number = Number(value.toString());
  if (!Number.isSafeInteger(number))
    throw new AppError(500, 'CATALOG_PRICE_RANGE', 'Giá vượt phạm vi API hỗ trợ.');
  return number;
};
