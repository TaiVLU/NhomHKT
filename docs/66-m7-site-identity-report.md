# M7.2B Site Identity Report

Status: IMPLEMENTED

## Scope

This report covers the M7.2B site identity work required by the approved M7.2A audit and the teacher SEO checklist alignment addendum.

RoSach remains local-only:

- Web: `http://localhost:3000`
- API: `http://127.0.0.1:4000/api/v1`
- No public deployment or active `rosach.vn` runtime configuration was added.

## Result

| Item | Status | Evidence |
|---|---|---|
| applicationName | PASS | `apps/web/app/layout.tsx` sets `applicationName` from the SEO runtime config site name. |
| metadataBase | PASS | `apps/web/app/layout.tsx` uses `seoRuntimeConfigFromEnvironment()`; canonical/OG URLs remain SEO Descriptor Platform-owned. |
| title template | PASS | `apps/web/lib/seo/core/config.ts` keeps `%s | RoSach`; tests prevent duplicate suffix. |
| default title | PASS | Home/root title remains `RoSach`. |
| manifest | PASS | `apps/web/app/manifest.ts`; route appears as `/manifest.webmanifest` in build output and references raster PNG icons. |
| favicon | PASS | `apps/web/public/favicon.svg`. |
| application icons | PASS | `apps/web/public/icon-192.png` 192x192 and `apps/web/public/icon-512.png` 512x512; SVG source assets retained. |
| apple touch icon | PASS | `apps/web/public/apple-touch-icon.png` 180x180; SVG source asset retained. |
| theme color | PASS | `#7a263a`, aligned with existing RoSach primary color token. |
| viewport | PASS | `width=device-width`, `initialScale=1`, no zoom lock. |
| language | PASS | Root layout keeps `<html lang="vi">`. |

## Files

| File | Purpose |
|---|---|
| `apps/web/app/layout.tsx` | Root metadata, metadataBase, icons, manifest link, viewport. |
| `apps/web/app/manifest.ts` | Local-safe manifest with no service worker/offline claim. |
| `apps/web/public/favicon.svg` | Browser favicon. |
| `apps/web/public/icon-192.png` | Manifest application icon, 192x192 PNG. |
| `apps/web/public/icon-512.png` | Manifest application icon, 512x512 PNG. |
| `apps/web/public/apple-touch-icon.png` | Apple touch icon, 180x180 PNG. |
| `apps/web/public/icon-192.svg`, `icon-512.svg`, `apple-touch-icon.svg` | Retained source/design assets. |
| `apps/web/tests/seo/site-identity.test.ts` | Regression coverage. |

## Teacher Checklist Alignment

| Teacher Area | Status | Note |
|---|---|---|
| Mobile-friendly viewport | PASS | Implemented through Next.js viewport export. |
| Brand/browser identity | PASS | Local favicon/icons/manifest exist. |
| www/non-www | REQUIRES PUBLIC DEPLOYMENT | No production domain exists; deployment must choose one canonical host. |
| SSL | REQUIRES PUBLIC DEPLOYMENT | Local-only app cannot certify HTTPS. |
| Analytics/Search Console | REQUIRES PUBLIC DEPLOYMENT | No tracking or verification IDs were added. |

## Tests

- `npm run test -w @rosach/web -- tests/seo/site-identity.test.ts tests/seo/metadata-regression.test.ts tests/seo/environment-regression.test.ts`: PASS, 3 files / final test count reported in closure.
- Full final gates are summarized in `docs/71-m7-seo-implementation-report.md`.

## Remaining Limitations

- External public preview tools cannot validate local-only metadata.
- Production `metadataBase` remains dependent on a real future `NEXT_PUBLIC_SITE_URL`; production origin safety is preserved.
