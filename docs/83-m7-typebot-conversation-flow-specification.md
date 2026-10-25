# M7.4C Typebot Conversation Flow Specification

Status: repository contract complete; authenticated Typebot workspace configuration and publish require manual evidence.

## Production flow

Build the Typebot Free flow with the following groups and connections:

1. **Start**: show the RoSach assistant greeting and quick actions.
2. **Collect input**: store the natural-language answer in `user_message`; quick actions may set approved public filters.
3. **Normalize variables**: clear stale response variables and ensure optional filters are either a valid scalar or `null`.
4. **HTTP Request**: call the RoSach public chatbot endpoint.
5. **Map response**: map the wrapped API fields listed below.
6. **Request condition**: branch to failure UX when the request fails; otherwise inspect `api_intent` and `api_result_count`.
7. **Product results**: show `api_message`, then one to three cards only when the corresponding title is non-null.
8. **Guide response**: for greeting, shopping, checkout, order, auth, or fallback intents, display `api_message` without duplicating backend intent logic.
9. **No results**: when `api_result_count = 0`, display `api_message` and retry/menu choices.
10. **Follow-up**: offer another search, price search, author search, shopping guide, or return to menu.

Backend intent precedence and price parsing remain authoritative. Typebot collects and presents; it does not recreate the parser.

## Variables

Request variables: `user_message`, `selected_category`, `selected_author`, `selected_publisher`, `selected_min_price`, `selected_max_price`, and `selected_available_only`.

Response variables: `api_intent`, `api_message`, `api_result_count`; `product_1_title`, `product_1_author`, `product_1_price`, `product_1_availability`, `product_1_image`, `product_1_url`; equivalent slot 2 and slot 3 variables; `suggestion_1`, `suggestion_2`; `request_failed`; and `public_error_message`.

## HTTP Request

- Method: `POST`.
- URL: `{PUBLIC_API_ORIGIN}/api/v1/chatbot/search`; it must be a stable public HTTPS origin, never localhost or a temporary tunnel.
- Execute on client: OFF.
- Header: `Content-Type: application/json` only.
- Timeout: 5 seconds, allowing network overhead above the backend's bounded 3-second catalog timeout.
- No Authorization, cookie, token, customer/order/cart/account identifier, or private variable.

Body:

```json
{
  "message": "{{user_message}}",
  "filters": {
    "category": null,
    "author": null,
    "publisher": null,
    "minPrice": null,
    "maxPrice": null,
    "availableOnly": true
  },
  "source": "TYPEBOT"
}
```

When the deterministic finder is used, replace only the relevant `null` values with the corresponding approved selected variables.

## Actual response mappings

The API success envelope is `{ success: true, data: { ...flattened fields }, requestId }`; fields are not at the response root.

| Typebot variable | Response path |
|---|---|
| `api_intent` | `data.intent` |
| `api_message` | `data.message` |
| `api_result_count` | `data.resultCount` |
| `product_1_title` | `data.product1Title` |
| `product_1_author` | `data.product1Author` |
| `product_1_price` | `data.product1Price` |
| `product_1_availability` | `data.product1Availability` |
| `product_1_image` | `data.product1Image` |
| `product_1_url` | `data.product1Url` |
| Slot 2 equivalents | `data.product2Title`, `Author`, `Price`, `Availability`, `Image`, `Url` |
| Slot 3 equivalents | `data.product3Title`, `Author`, `Price`, `Availability`, `Image`, `Url` |
| `suggestion_1` | `data.suggestion1` |
| `suggestion_2` | `data.suggestion2` |
| `public_error_message` | `error.message` on non-success responses |

Set `request_failed = true` for network failure, timeout, or non-success status. Clear it before each retry.

## Result and failure presentation

For each slot whose title is non-null, display title, optional author, formatted price, public availability, optional public image, and a button labelled **Xem sản phẩm** whose URL is the backend-supplied `product_N_url`. Never construct a product URL from user input.

No-results choices: **Thử từ khóa khác**, **Chọn khoảng giá khác**, **Tìm sách còn hàng**, and **Quay lại menu**.

Generic failure text: **Hệ thống tư vấn đang tạm thời bận. Bạn vui lòng thử lại sau ít phút.** Rate-limit text: **Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng đợi một phút rồi thử lại.** Both branches offer retry and return-to-menu actions and reveal no HTTP or database internals.

Typebot Free branding is accepted. The bot must not request email, phone, address, password, OTP, payment information, authentication tokens, or order details.
