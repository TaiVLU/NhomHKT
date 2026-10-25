import { describe, expect, it, vi } from 'vitest';
import type { CatalogService } from '../src/modules/catalog/catalog.service.js';
import { chatbotSearchSchema } from '../src/modules/chatbot/chatbot.schema.js';
import {
  ChatbotService,
  parseChatbotIntent,
  parsePriceRange,
} from '../src/modules/chatbot/chatbot.service.js';

describe('chatbot deterministic parser', () => {
  it.each([
    ['xin chào', 'GREETING'],
    ['tìm sách phát triển bản thân', 'PRODUCT_SEARCH'],
    ['sách thiếu nhi', 'PRODUCT_BY_CATEGORY'],
    ['sách của Nguyễn Nhật Ánh', 'PRODUCT_BY_AUTHOR'],
    ['sách dưới 200 nghìn', 'PRODUCT_BY_PRICE'],
    ['sách nào còn hàng', 'PRODUCT_AVAILABILITY'],
    ['cho tôi thông tin cuốn này', 'PRODUCT_INFO'],
    ['làm sao thêm vào giỏ', 'SHOPPING_GUIDE'],
    ['làm sao thanh toán', 'CHECKOUT_GUIDE'],
    ['xem đơn hàng ở đâu', 'ORDER_GUIDE'],
    ['tôi quên mật khẩu', 'AUTH_GUIDE'],
    ['thời tiết hôm nay', 'FALLBACK'],
  ])('maps %s to %s', (message, intent) => expect(parseChatbotIntent(message).intent).toBe(intent));
  it('uses deterministic guide precedence', () =>
    expect(parseChatbotIntent('quên mật khẩu và tìm sách').intent).toBe('AUTH_GUIDE'));
  it.each([
    ['200k', { maxPrice: 200000 }],
    ['200 K', { maxPrice: 200000 }],
    ['200 nghìn', { maxPrice: 200000 }],
    ['200 ngàn', { maxPrice: 200000 }],
    ['200.000', { maxPrice: 200000 }],
    ['200000', { maxPrice: 200000 }],
    ['dưới 200 nghìn', { maxPrice: 200000 }],
    ['không quá 200k', { maxPrice: 200000 }],
    ['tối đa 200k', { maxPrice: 200000 }],
    ['từ 100 đến 200 nghìn', { minPrice: 100000, maxPrice: 200000 }],
    ['từ 100k đến 200k', { minPrice: 100000, maxPrice: 200000 }],
  ])('parses %s', (message, expected) => expect(parsePriceRange(message)).toEqual(expected));
  it.each([
    'ISBN 9786041234567',
    'năm 2024',
    'mua 2 cuốn',
    'số điện thoại 0901234567',
    'mã đơn 123456',
    '3 quyển',
  ])('does not parse %s as price', (message) => expect(parsePriceRange(message)).toEqual({}));
  it.each(['123456', 'ma san pham 200000', 'tu 200 den 100 nghin'])(
    'does not parse ambiguous or invalid range %s',
    (message) => expect(parsePriceRange(message)).toEqual({}),
  );
});

describe('chatbot validation and DTO', () => {
  it('accepts normalized strict request', () =>
    expect(
      chatbotSearchSchema.parse({ message: '  tìm   sách  ', source: 'TYPEBOT' }).message,
    ).toBe('tìm sách'));
  it.each([
    {},
    { message: '   ', source: 'TYPEBOT' },
    { message: 'x', source: 'BAD' },
    { message: 'x', source: 'TYPEBOT', extra: true },
    { message: 'x', source: 'TYPEBOT', filters: { minPrice: -1 } },
    { message: 'x', source: 'TYPEBOT', filters: { minPrice: 2, maxPrice: 1 } },
    { message: ['x'], source: 'TYPEBOT' },
  ])('rejects invalid request %#', (value) =>
    expect(chatbotSearchSchema.safeParse(value).success).toBe(false),
  );
  it.each([
    'https://attacker.example/path',
    'SELECT password FROM User',
    'orderId 123456',
    'Bearer secret-token',
  ])('rejects unsafe input %s', (message) =>
    expect(chatbotSearchSchema.safeParse({ message, source: 'TYPEBOT' }).success).toBe(false),
  );
  it('returns at most three flattened public slots', async () => {
    const products = Array.from({ length: 4 }, (_, i) => ({
      name: `Book ${i}`,
      slug: `book-${i}`,
      publicationState: 'ACTIVE',
      visible: true,
      purchasable: true,
      authors: [{ name: 'Author' }],
      minPrice: 100000 + i,
      availability: { inStock: true },
      primaryImage: { url: 'https://example.com/a.jpg' },
    }));
    const publicProducts = vi
      .fn()
      .mockResolvedValue({ data: products, meta: { page: 1, pageSize: 3, total: 4 } });
    const service = new ChatbotService(
      { publicProducts } as unknown as CatalogService,
      'https://hktstore.example',
    );
    const result = await service.search({ message: 'tìm sách hay', source: 'TYPEBOT' });
    expect(publicProducts).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 3 }));
    expect(result.resultCount).toBe(3);
    expect(result.product3Title).toBe('Book 2');
    expect(result).not.toHaveProperty('products');
    expect(result).not.toHaveProperty('id');
    expect(result.product1Url).toBe('https://hktstore.example/sach/book-0');
  });
  it('resolves owned relative demo images against the canonical public origin', async () => {
    const publicProducts = vi.fn().mockResolvedValue({
      data: [
        {
          name: 'Sách sạch',
          slug: 'sach-sach',
          publicationState: 'ACTIVE',
          visible: true,
          purchasable: true,
          authors: [{ name: 'Tác giả' }],
          minPrice: 100000,
          availability: { inStock: true },
          primaryImage: { url: '/demo-covers/van-hoc.png' },
        },
      ],
      meta: { page: 1, pageSize: 3, total: 1 },
    });
    const service = new ChatbotService(
      { publicProducts } as unknown as CatalogService,
      'https://hktstore.example',
    );
    const result = await service.search({ message: 'tìm sách', source: 'TYPEBOT' });
    expect(result.product1Image).toBe('https://hktstore.example/demo-covers/van-hoc.png');
  });
  it('keeps all slots null on no results and skips catalog for guides', async () => {
    const publicProducts = vi
      .fn()
      .mockResolvedValue({ data: [], meta: { page: 1, pageSize: 3, total: 0 } });
    const service = new ChatbotService(
      { publicProducts } as unknown as CatalogService,
      'https://hktstore.example',
    );
    const empty = await service.search({ message: 'tìm sách không tồn tại', source: 'TYPEBOT' });
    expect(empty.resultCount).toBe(0);
    expect(empty.product1Title).toBeNull();
    expect(empty.product3Url).toBeNull();
    await service.search({ message: 'quên mật khẩu', source: 'TYPEBOT' });
    expect(publicProducts).toHaveBeenCalledTimes(1);
  });
  it('defensively excludes non-public or non-sellable catalog rows', async () => {
    const base = {
      name: 'Book',
      slug: 'book',
      publicationState: 'ACTIVE',
      visible: true,
      purchasable: true,
      authors: [],
      minPrice: 100000,
      availability: { inStock: true },
      primaryImage: null,
    };
    const publicProducts = vi.fn().mockResolvedValue({
      data: [
        { ...base, name: 'Hidden', visible: false },
        { ...base, name: 'Unavailable', purchasable: false },
        { ...base, name: 'Public' },
      ],
      meta: { page: 1, pageSize: 3, total: 3 },
    });
    const service = new ChatbotService(
      { publicProducts } as unknown as CatalogService,
      'https://hktstore.example',
    );
    const response = await service.search({ message: 'tìm sách', source: 'TYPEBOT' });
    expect(response.resultCount).toBe(1);
    expect(response.product1Title).toBe('Public');
    expect(response.product2Title).toBeNull();
  });
  it('passes category, author, publisher, price and availability through the public catalog boundary', async () => {
    const publicProducts = vi
      .fn()
      .mockResolvedValue({ data: [], meta: { page: 1, pageSize: 3, total: 0 } });
    const service = new ChatbotService(
      { publicProducts } as unknown as CatalogService,
      'https://hktstore.example',
    );
    await service.search({
      message: 'sách thiếu nhi',
      source: 'TYPEBOT',
      filters: {
        publisher: 'nha-xuat-ban-tre',
        minPrice: 100000,
        maxPrice: 200000,
        availableOnly: true,
      },
    });
    expect(publicProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'thieu-nhi',
        publisher: 'nha-xuat-ban-tre',
        minPrice: 100000,
        maxPrice: 200000,
        inStock: 'true',
        pageSize: 3,
      }),
    );
    await service.search({ message: 'sách của Nguyễn Nhật Ánh', source: 'TYPEBOT' });
    expect(publicProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ author: 'nguyen-nhat-anh' }),
    );
    await service.search({ source: 'TYPEBOT', filters: { publisher: 'kim-dong' } });
    expect(publicProducts).toHaveBeenLastCalledWith(
      expect.objectContaining({ publisher: 'kim-dong' }),
    );
  });
  it('maps a bounded catalog timeout to a stable public error', async () => {
    const publicProducts = vi.fn().mockReturnValue(new Promise(() => undefined));
    const service = new ChatbotService(
      { publicProducts } as unknown as CatalogService,
      'https://hktstore.example',
      1,
    );
    await expect(
      service.search({ message: 'tìm sách hay', source: 'TYPEBOT' }),
    ).rejects.toMatchObject({ status: 504, code: 'CHATBOT_SEARCH_TIMEOUT' });
  });
});