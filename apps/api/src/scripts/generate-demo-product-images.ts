import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { demoAuthors, demoProducts } from '../seed/demo-data.js';

const outputRoot = join(process.cwd(), '..', 'web', 'public', 'product-images');
const authorNames = new Map(demoAuthors.map((author) => [author.slug, author.name]));
const palettes: Readonly<Record<string, readonly [string, string, string]>> = {
  'van-hoc': ['#753d2f', '#d99c74', '#fff4e8'],
  'thieu-nhi': ['#146b74', '#f0b94a', '#fff7dc'],
  'kinh-te': ['#1f4f3f', '#be8c4a', '#f4eedf'],
  'ky-nang-song': ['#714663', '#e0a178', '#fff2e9'],
  'phat-trien-ban-than': ['#31557a', '#e0aa5f', '#f3f7fb'],
  'khoa-hoc': ['#173a5e', '#63a8b8', '#eef8f9'],
  'lich-su': ['#67472c', '#c39a61', '#f6eddf'],
  'cong-nghe-thong-tin': ['#263761', '#61a7a3', '#eef8f7'],
};

const escapeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const frame = (content: string, colors: readonly [string, string, string]): string => `
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: transparent; font-family: Georgia, 'Times New Roman', serif; }
    #asset { position: relative; width: 600px; height: 900px; overflow: hidden; color: ${colors[2]};
      background: linear-gradient(145deg, ${colors[0]}, ${colors[1]}); }
    .noise { position:absolute; inset:0; opacity:.13; background-image:radial-gradient(#fff 1px,transparent 1px); background-size:13px 13px; }
    .content { position: relative; z-index: 1; height: 100%; padding: 64px 58px; display: flex; flex-direction: column; }
    .brand { letter-spacing:.3em; font:700 18px Arial,sans-serif; text-transform:uppercase; }
    .title { margin:auto 0 24px; font-size:52px; line-height:1.08; text-wrap:balance; }
    .author { font:700 21px Arial,sans-serif; letter-spacing:.06em; }
    .rule { width:82px; height:7px; margin:24px 0; background:${colors[2]}; }
    .role { font:700 18px Arial,sans-serif; letter-spacing:.18em; text-transform:uppercase; }
    .paper { margin:auto 0; min-height:690px; border-radius:8px; background:#fffdf7; color:#40362f; padding:55px 50px; box-shadow:0 12px 36px #1a120d55; }
    .paper h1 { margin:0 0 18px; font-size:30px; line-height:1.2; }
    .paper h2 { margin:0 0 32px; color:${colors[0]}; font:700 15px Arial,sans-serif; letter-spacing:.15em; text-transform:uppercase; }
    .line { height:9px; margin:14px 0; border-radius:4px; background:#d9d1c5; }
    .line.short { width:68%; } .line.mid { width:84%; }
    .quote { margin:42px 0; border-left:6px solid ${colors[1]}; padding:18px 22px; background:#f5eee4; font-size:22px; line-height:1.45; }
    .back-copy { margin:auto 0; padding:34px; border:1px solid #ffffff88; background:#1b171344; font-size:23px; line-height:1.55; }
    .isbn { margin-top:auto; align-self:flex-end; padding:18px; background:#fff; color:#222; font:16px monospace; letter-spacing:.12em; }
  </style>
  <div id="asset"><div class="noise"></div><div class="content">${content}</div></div>`;

const lineSet =
  '<div class="line"></div><div class="line mid"></div><div class="line"></div><div class="line short"></div><div class="line"></div>';

const run = async (): Promise<void> => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 600, height: 900 },
    deviceScaleFactor: 1,
  });
  for (const product of demoProducts.filter((item) => item.publicationState === 'ACTIVE')) {
    const colors = palettes[product.primaryCategorySlug ?? ''] ?? palettes['van-hoc']!;
    const author = authorNames.get(product.authorSlugs[0] ?? '') ?? 'HKT Store';
    const directory = join(outputRoot, product.slug);
    await mkdir(directory, { recursive: true });
    const assets = [
      [
        'cover.png',
        `<div class="brand">HKT Store</div><div class="title">${escapeHtml(product.name)}</div><div class="rule"></div><div class="author">${escapeHtml(author)}</div>`,
      ],
      [
        'back-cover.png',
        `<div class="brand">HKT Store</div><div class="role">Bìa sau</div><div class="back-copy">${escapeHtml(product.shortDescription)}</div><div class="isbn">HKT STORE · DEMO EDITION</div>`,
      ],
      [
        'preview-01.png',
        `<div class="paper"><h2>Trang xem thử 01</h2><h1>${escapeHtml(product.name)}</h1>${lineSet}<div class="quote">Một trang xem thử trung tính dành cho dữ liệu trình diễn</div>${lineSet}</div>`,
      ],
      [
        'preview-02.png',
        `<div class="paper"><h2>Trang xem thử 02</h2><h1>${escapeHtml(product.name)}</h1><div class="quote">Nội dung thật có thể được thay thế theo quy trình tài sản đã duyệt</div>${lineSet}${lineSet}</div>`,
      ],
    ] as const;
    for (const [fileName, content] of assets) {
      await page.setContent(frame(content, colors));
      await page.locator('#asset').screenshot({ path: join(directory, fileName) });
    }
  }
  await browser.close();
};

void run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});