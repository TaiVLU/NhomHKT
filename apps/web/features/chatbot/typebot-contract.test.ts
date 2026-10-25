import { describe, expect, it } from 'vitest';
import { typebotRequestBody, typebotResponsePaths } from './typebot-contract';

const product = (slot: number) => ({
  [`product${slot}Title`]: `Book ${slot}`,
  [`product${slot}Author`]: `Author ${slot}`,
  [`product${slot}Price`]: '120.000 ₫',
  [`product${slot}Availability`]: 'Còn hàng',
  [`product${slot}Image`]: `https://images.example/book-${slot}.jpg`,
  [`product${slot}Url`]: `https://hktstore.example/sach/book-${slot}`,
});

const response = (count: 0 | 1 | 2 | 3) => ({
  success: true,
  data: {
    intent: count ? 'PRODUCT_SEARCH' : 'FALLBACK',
    message: count ? 'Mình tìm thấy sách phù hợp.' : 'Mình chưa tìm thấy sách phù hợp.',
    resultCount: count,
    ...Object.fromEntries(
      [1, 2, 3].flatMap((slot) =>
        Object.entries(
          slot <= count
            ? product(slot)
            : {
                [`product${slot}Title`]: null,
                [`product${slot}Author`]: null,
                [`product${slot}Price`]: null,
                [`product${slot}Availability`]: null,
                [`product${slot}Image`]: null,
                [`product${slot}Url`]: null,
              },
        ),
      ),
    ),
    suggestion1: 'Tìm sách khác',
    suggestion2: 'Xem hướng dẫn mua hàng',
  },
  requestId: 'public-request-id',
});

const readPath = (value: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((current, key) => {
    if (typeof current !== 'object' || current === null || !(key in current)) return undefined;
    return current[key as keyof typeof current];
  }, value);

describe('Typebot API contract fixture', () => {
  it('uses the approved public request without credentials or identifiers', () => {
    expect(typebotRequestBody).toMatchObject({ source: 'TYPEBOT' });
    expect(JSON.stringify(typebotRequestBody)).not.toMatch(
      /authorization|cookie|token|customerId|cartId|orderId/iu,
    );
  });

  it.each([0, 1, 2, 3] as const)('maps the wrapped flattened response for %i results', (count) => {
    const fixture = response(count);
    expect(readPath(fixture, typebotResponsePaths.resultCount)).toBe(count);
    expect(readPath(fixture, typebotResponsePaths.product1Title)).toBe(count ? 'Book 1' : null);
    expect(readPath(fixture, typebotResponsePaths.product3Title)).toBe(
      count === 3 ? 'Book 3' : null,
    );
    expect(fixture.data).not.toHaveProperty('products');
  });

  it('maps guide and public error responses without internal fields', () => {
    const guide = response(0);
    guide.data.intent = 'SHOPPING_GUIDE';
    expect(readPath(guide, typebotResponsePaths.intent)).toBe('SHOPPING_GUIDE');
    const error = {
      success: false,
      error: { code: 'CHATBOT_SEARCH_TIMEOUT', message: 'Vui lòng thử lại sau.' },
      requestId: 'public-request-id',
    };
    expect(readPath(error, typebotResponsePaths.publicErrorMessage)).toBe('Vui lòng thử lại sau.');
    expect(JSON.stringify(error)).not.toMatch(/prisma|sql|stack|secret/iu);
  });
});