import { expect, test } from '@playwright/test';
import jsQR from 'jsqr';
import { answerVideoExample } from './helpers';

test('链接复现输入', async ({ page, browser }) => {
  await answerVideoExample(page);
  await expect(page.locator('#total')).toHaveText('1,870 万');
  const url = page.url();
  expect(url).toContain('v=1');
  const other = await (await browser.newContext({ locale: 'zh-CN' })).newPage();
  await other.goto(url);
  await expect(other.locator('#total')).toHaveText('1,870 万');
  await expect(other.locator('button.row')).toHaveCount(4);
});

test('切换到英文后文案与金额格式变化，并写进链接', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '先用视频的例子看一遍' }).click();
  await page.locator('#lang').click();
  await expect(page.locator('#total')).toHaveText('¥18.7M');
  await expect(page.getByRole('button', { name: 'How much do I have?' })).toBeVisible();
  await expect(page.getByText('Video example')).toBeVisible();
  expect(page.url()).toContain('lang=en');
});

test('分享图生成 1080×1440 的图片，二维码扫出来是不带参数的网址', async ({ page, baseURL }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '先用视频的例子看一遍' }).click();
  await page.getByRole('button', { name: '分享图' }).click();
  const img = page.locator('#shareImg');
  await expect(img).toBeVisible();
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => `${el.naturalWidth}x${el.naturalHeight}`)).toBe('1080x1440');
  const { w, h, rgba } = await img.evaluate((el: HTMLImageElement) => {
    const c = document.createElement('canvas');
    c.width = el.naturalWidth;
    c.height = el.naturalHeight;
    const g = c.getContext('2d')!;
    g.drawImage(el, 0, 0);
    return { w: c.width, h: c.height, rgba: Array.from(g.getImageData(0, 0, c.width, c.height).data) };
  });
  expect(jsQR(Uint8ClampedArray.from(rgba), w, h)?.data).toBe(`${baseURL}/`);
  await page.getByRole('button', { name: '关闭' }).click();
  await expect(img).toHaveCount(0);
});

test('复制链接：成功提示或退回手动复制框', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '先用视频的例子看一遍' }).click();
  await page.getByRole('button', { name: '复制链接' }).click();
  await expect.poll(async () =>
    (await page.getByText('链接已复制').count()) + (await page.locator('#linkBox').count())).toBeGreaterThan(0);
});

test('元信息不含原型，带分享卡片', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('你需要多少钱，才能财富自由？');
  const og = await page.locator('meta[property="og:title"]').getAttribute('content');
  expect(og).toBeTruthy();
  expect(og).not.toContain('原型');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\.png$/);
});

test('结果页和开场页有去 GitHub 点 Star 的链接', async ({ page }) => {
  await page.goto('/');
  const introLink = page.getByRole('link', { name: 'GitHub' });
  await expect(introLink).toHaveAttribute('href', 'https://github.com/zahT3/fire-calc');
  await page.getByRole('button', { name: '先用视频的例子看一遍' }).click();
  const star = page.getByRole('link', { name: /去 GitHub 点个 ⭐/ });
  await expect(star).toHaveAttribute('href', 'https://github.com/zahT3/fire-calc');
  await expect(star).toHaveAttribute('target', '_blank');
  await expect(star).toHaveAttribute('rel', /noopener/);
});
