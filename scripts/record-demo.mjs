// 录制 README 用的演示：node scripts/record-demo.mjs <网址> <输出 webm 目录>
import { chromium } from '@playwright/test';

const [, , url = 'http://localhost:5199/', dir = '/tmp/fc-demo'] = process.argv;
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, locale: 'zh-CN',
  recordVideo: { dir, size: { width: 390, height: 844 } },
});
const page = await context.newPage();
const pause = (ms) => page.waitForTimeout(ms);

await page.goto(url);
await pause(1400);
await page.getByRole('button', { name: '开始', exact: true }).click();
await pause(700);
await page.locator('input[name=monthlySpend]').pressSequentially('15000', { delay: 120 });
await pause(500);
await page.click('#next');
await pause(1500);
await page.getByRole('button', { name: '2', exact: true }).click();
await pause(400);
await page.getByRole('button', { name: '150 万', exact: true }).click();
await pause(600);
await page.click('#next');
await pause(1500);
await page.getByRole('button', { name: '150 万', exact: true }).click();
await pause(600);
await page.click('#next');
await pause(1500);
await page.getByRole('button', { name: '打算买一套' }).click();
await pause(400);
await page.getByRole('button', { name: '700 万', exact: true }).click();
await pause(600);
await page.click('#next');
await pause(3000);
await context.close();
await browser.close();
