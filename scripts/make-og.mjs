// 生成链接预览图 src/web/public/og.png（1200×630）。用法：node scripts/make-og.mjs
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const out = fileURLToPath(new URL('../src/web/public/og.png', import.meta.url));
const parts = [['#bcff2f', 72], ['#f0a58c', 30], ['#b9d3c9', 15], ['#e9dcc6', 70]];
const cells = parts.flatMap(([c, n]) => Array(n).fill(`<i style="background:${c}"></i>`)).join('');

const html = `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; width: 1200px; height: 630px; background: #000; color: #fff; display: flex; gap: 56px; padding: 72px; box-sizing: border-box;
    font-family: -apple-system, "PingFang SC", "Helvetica Neue", sans-serif; }
  .l { flex: 1; display: flex; flex-direction: column; }
  h1 { font-size: 60px; line-height: 1.2; margin: 0; font-weight: 800; }
  .en { margin-top: 18px; font-size: 24px; color: #8a8a8a; }
  .n { margin-top: auto; font: 800 58px ui-monospace, "SF Mono", Menlo, monospace; color: #bcff2f; letter-spacing: -2px; }
  .f { font: 500 24px ui-monospace, "SF Mono", Menlo, monospace; color: #8a8a8a; margin-top: 8px; }
  .g { display: grid; grid-template-columns: repeat(17, 22px); gap: 5px; align-content: center; }
  .g i { width: 22px; height: 22px; border-radius: 4px; }
</style>
<div class="l"><h1>你需要多少钱，<br>才能财富自由？</h1><div class="en">How much do you need to be financially free?</div>
<div class="n">480X + K·n + M + H</div><div class="f">4 questions · your own number</div></div>
<div class="g">${cells}</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: out });
await browser.close();
console.log(`wrote ${out}`);
