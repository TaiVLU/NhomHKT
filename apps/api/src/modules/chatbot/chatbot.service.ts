import { AppError } from '../../shared/errors/app-error.js';
import type { CatalogService } from '../catalog/catalog.service.js';
import type { ChatbotSearchInput } from './chatbot.schema.js';

export type ChatbotIntent =
  | 'GREETING'
  | 'PRODUCT_SEARCH'
  | 'PRODUCT_BY_CATEGORY'
  | 'PRODUCT_BY_AUTHOR'
  | 'PRODUCT_BY_PRICE'
  | 'PRODUCT_AVAILABILITY'
  | 'PRODUCT_INFO'
  | 'SHOPPING_GUIDE'
  | 'CHECKOUT_GUIDE'
  | 'ORDER_GUIDE'
  | 'AUTH_GUIDE'
  | 'FALLBACK';

type ParsedIntent = {
  intent: ChatbotIntent;
  query?: string;
  category?: string;
  author?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
};
type SlotValue = string | null;
export interface ChatbotResponse {
  intent: ChatbotIntent;
  message: string;
  resultCount: number;
  product1Title: SlotValue;
  product1Author: SlotValue;
  product1Price: SlotValue;
  product1Availability: SlotValue;
  product1Image: SlotValue;
  product1Url: SlotValue;
  product2Title: SlotValue;
  product2Author: SlotValue;
  product2Price: SlotValue;
  product2Availability: SlotValue;
  product2Image: SlotValue;
  product2Url: SlotValue;
  product3Title: SlotValue;
  product3Author: SlotValue;
  product3Price: SlotValue;
  product3Availability: SlotValue;
  product3Image: SlotValue;
  product3Url: SlotValue;
  suggestion1: string;
  suggestion2: string;
}

export const normalizeVietnamese = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/đ/gu, 'd')
    .replace(/Đ/gu, 'D')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLowerCase();

const slugFromText = (value: string): string =>
  normalizeVietnamese(value)
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');

const publicAssetUrl = (value: string | null | undefined, origin: string): string | null => {
  if (!value?.trim()) return null;
  try {
    return new URL(value, origin).toString();
  } catch {
    return null;
  }
};

const numericPrice = (digits: string, suffix?: string): number => {
  const compact = digits.replace(/[.,]/gu, '');
  const amount = Number(compact);
  return suffix || amount < 10_000 ? amount * 1000 : amount;
};

export const parsePriceRange = (message: string): Pick<ParsedIntent, 'minPrice' | 'maxPrice'> => {
  const text = normalizeVietnamese(message);
  if (
    /\b(?:isbn|nam|ma don|ma san pham|dien thoai)\b/u.test(text) ||
    /\b\d+\s*(?:cuon|quyen|san pham)\b/u.test(text) ||
    /\b0\d{9,10}\b/u.test(text)
  )
    return {};
  const range = text.match(
    /\btu\s+(\d{1,3}(?:[.,]\d{3})*|\d+)\s*(k|nghin|ngan)?\s+den\s+(\d{1,3}(?:[.,]\d{3})*|\d+)\s*(k|nghin|ngan)?\b/u,
  );
  if (range?.[1] && range[3]) {
    const minPrice = numericPrice(range[1], range[2] ?? range[4]);
    const maxPrice = numericPrice(range[3], range[4] ?? range[2]);
    return minPrice <= maxPrice ? { minPrice, maxPrice } : {};
  }
  const contextual = text.match(
    /\b(duoi|khong qua|toi da|tren)\s+(\d{1,3}(?:[.,]\d{3})*|\d+)\s*(k|nghin|ngan)?\b/u,
  );
  if (contextual?.[1] && contextual[2]) {
    const amount = numericPrice(contextual[2], contextual[3]);
    return contextual[1] === 'tren' ? { minPrice: amount } : { maxPrice: amount };
  }
  const explicit = text.match(/\b(\d{1,3}(?:[.,]\d{3})*|\d+)\s*(k|nghin|ngan)\b/u);
  if (explicit?.[1]) return { maxPrice: numericPrice(explicit[1], explicit[2]) };
  const formatted = text.match(/\b(\d{1,3}(?:[.]\d{3})+)\b/u);
  if (formatted?.[1]) return { maxPrice: numericPrice(formatted[1]) };
  const vndInteger = text.match(/\b(\d{5,8})\b/u);
  if (!vndInteger?.[1]) return {};
  const amount = Number(vndInteger[1]);
  return amount % 1000 === 0 ? { maxPrice: amount } : {};
};

export const parseChatbotIntent = (message: string): ParsedIntent => {
  const text = normalizeVietnamese(message);
  if (!text) return { intent: 'FALLBACK' };
  if (/quen mat khau|dang nhap|tao tai khoan|dang ky/u.test(text)) return { intent: 'AUTH_GUIDE' };
  if (/xem don hang|lich su mua|kiem tra don/u.test(text)) return { intent: 'ORDER_GUIDE' };
  if (/thanh toan|dat hang/u.test(text)) return { intent: 'CHECKOUT_GUIDE' };
  if (/them.+gio|cach mua/u.test(text)) return { intent: 'SHOPPING_GUIDE' };
  if (/^(xin chao|chao ban|chao|hello)\b/u.test(text)) return { intent: 'GREETING' };
  const author = text.match(/(?:sach cua|tac gia)\s+(.+?)(?:\s+khong)?$/u)?.[1];
  if (author) return { intent: 'PRODUCT_BY_AUTHOR', author: slugFromText(author) };
  const prices = parsePriceRange(text);
  if (prices.minPrice !== undefined || prices.maxPrice !== undefined)
    return { intent: 'PRODUCT_BY_PRICE', ...prices };
  const category =
    text.match(/(?:danh muc|the loai)\s+([a-z0-9][a-z0-9 ]{1,80})$/u)?.[1] ??
    text.match(/\bsach\s+(thieu nhi|kinh te|van hoc)\b/u)?.[1];
  if (category) return { intent: 'PRODUCT_BY_CATEGORY', category: slugFromText(category) };
  if (/con hang|co san|dang ban|con khong/u.test(text))
    return { intent: 'PRODUCT_AVAILABILITY', query: text, inStock: true };
  if (/thong tin cuon|mo ta sach|noi ve gi/u.test(text))
    return { intent: 'PRODUCT_INFO', query: text };
  if (/tim sach|co sach|goi y sach|\bsach\b/u.test(text))
    return { intent: 'PRODUCT_SEARCH', query: text.replace(/^(tim|goi y)\s+sach\s*/u, '') };
  return { intent: 'FALLBACK' };
};

const emptyResponse = (intent: ChatbotIntent, message: string): ChatbotResponse => ({
  intent,
  message,
  resultCount: 0,
  product1Title: null,
  product1Author: null,
  product1Price: null,
  product1Availability: null,
  product1Image: null,
  product1Url: null,
  product2Title: null,
  product2Author: null,
  product2Price: null,
  product2Availability: null,
  product2Image: null,
  product2Url: null,
  product3Title: null,
  product3Author: null,
  product3Price: null,
  product3Availability: null,
  product3Image: null,
  product3Url: null,
  suggestion1: 'Tìm sản phẩm phù hợp',
  suggestion2: 'Xem danh mục',
});

const guide = (intent: ChatbotIntent): ChatbotResponse | null => {
  const messages: Partial<Record<ChatbotIntent, string>> = {
    GREETING:
      'Xin chào! HKT Store có thể hỗ trợ gì cho bạn về tìm kiếm truyện tranh, sách hay đơn hàng hôm nay',
    SHOPPING_GUIDE:
      'Mở trang chi tiết, chọn phiên bản cùng số lượng mong muốn rồi bấm thêm vào giỏ hàng',
    CHECKOUT_GUIDE:
      'Đăng nhập tài khoản nếu có, chọn địa chỉ giao nhận và xác nhận phương thức thanh toán',
    ORDER_GUIDE:
      'Bạn có thể tra cứu nhanh lịch sử đơn hàng tại mục /tai-khoan/don-hang',
    AUTH_GUIDE:
      'Bạn có thể đăng nhập tại /dang-nhap, tạo tài khoản mới tại /dang-ky hoặc lấy lại mật khẩu tại /quen-mat-khau',
    FALLBACK:
      'Chưa tìm thấy thông tin phù hợp, bạn hãy thử nhập tên truyện, tên sách, tác giả hoặc thể loại để được hỗ trợ chính xác hơn',
  };
  const message = messages[intent];
  return message ? emptyResponse(intent, message) : null;
};

export class ChatbotService {
  constructor(
    private readonly catalog: CatalogService,
    private readonly origin: string,
    private readonly timeoutMs = 3000,
  ) {}
  async search(input: ChatbotSearchInput): Promise<ChatbotResponse> {
    const filters = input.filters ?? {};
    const detected = parseChatbotIntent(input.message ?? '');
    const parsed: ParsedIntent =
      detected.intent !== 'FALLBACK' || !filters
        ? detected
        : filters.category
          ? { intent: 'PRODUCT_BY_CATEGORY' }
          : filters.author
            ? { intent: 'PRODUCT_BY_AUTHOR' }
            : filters.minPrice != null || filters.maxPrice != null
              ? { intent: 'PRODUCT_BY_PRICE' }
              : filters.availableOnly
                ? { intent: 'PRODUCT_AVAILABILITY', inStock: true }
                : filters.publisher
                  ? { intent: 'PRODUCT_SEARCH' }
                  : detected;
    const staticResponse = guide(parsed.intent);
    if (staticResponse) return staticResponse;
    try {
      const lookup = this.catalog.publicProducts({
        q: parsed.query,
        category: filters.category ?? parsed.category,
        author: filters.author ?? parsed.author,
        publisher: filters.publisher ?? undefined,
        minPrice: filters.minPrice ?? parsed.minPrice,
        maxPrice: filters.maxPrice ?? parsed.maxPrice,
        inStock: 'true',
        sort: 'newest',
        page: 1,
        pageSize: 3,
      });
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new AppError(
                504,
                'CHATBOT_SEARCH_TIMEOUT',
                'Yêu cầu tìm kiếm mất quá nhiều thời gian',
              ),
            ),
          this.timeoutMs,
        );
      });
      const result = await Promise.race([lookup, timeout]).finally(() => {
        if (timer) clearTimeout(timer);
      });
      const rows = result.data
        .filter(
          (product) =>
            product.publicationState === 'ACTIVE' && product.visible && product.purchasable,
        )
        .slice(0, 3);
      const response = emptyResponse(
        parsed.intent,
        rows.length
          ? 'Đã tìm thấy các ấn phẩm phù hợp'
          : 'Chưa tìm thấy ấn phẩm nào phù hợp với yêu cầu hiện tại',
      );
      response.resultCount = rows.length;
      rows.forEach((product, index) => {
        const slot = index + 1;
        const assign = (field: string, value: SlotValue) => {
          (response as unknown as Record<string, unknown>)[`product${slot}${field}`] = value;
        };
        assign('Title', product.name);
        assign('Author', product.authors.map((a) => a.name).join(', ') || 'Đang cập nhật tác giả');
        assign(
          'Price',
          new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
          }).format(product.minPrice),
        );
        assign('Availability', product.availability.inStock ? 'Còn hàng' : 'Tạm hết hàng');
        assign('Image', publicAssetUrl(product.primaryImage?.url, this.origin));
        assign('Url', new URL(`/sach/${product.slug}`, this.origin).toString());
      });
      response.suggestion1 = 'Tìm giá thấp hơn';
      response.suggestion2 = 'Chọn danh mục khác';
      return response;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        503,
        'CHATBOT_UPSTREAM_UNAVAILABLE',
        'Dịch vụ tra cứu hiện tạm thời gián đoạn',
      );
    }
  }
}