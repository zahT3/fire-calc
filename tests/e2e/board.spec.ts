import { expect, test } from '@playwright/test';
import { start } from './helpers';

test('第 1 题提交后出现飞行格，结束后无残留，方格为 144 格', async ({ page }) => {
  await start(page);
  await page.fill('input[name=monthlySpend]', '15000');
  await page.click('#next');
  await page.waitForTimeout(120);
  expect(await page.locator('.fly').count()).toBeGreaterThan(0);
  await expect(page.locator('.fly')).toHaveCount(0, { timeout: 3000 });
  await expect(page.locator('#cellCount')).toHaveText('144 格');
  await expect(page.locator('#unit')).toHaveText('一格 = 5 万');
  // 飞完后格子全部可见
  const hidden = await page.locator('#grid i[style*="opacity: 0"]').count();
  expect(hidden).toBe(0);
});

test('连点两次下一步只前进一题', async ({ page }) => {
  await start(page);
  await page.fill('input[name=monthlySpend]', '15000');
  await page.click('#next');
  await page.getByRole('button', { name: '0', exact: true }).click();
  await page.locator('button.tab').first().click();
  await expect(page.locator('h2')).toHaveText('每月想花多少？');
  await page.locator('#next').dblclick();
  await expect(page.locator('h2')).toHaveText('几个孩子？');
  await page.waitForTimeout(600);
  await expect(page.locator('h2')).toHaveText('几个孩子？');
});

test('减弱动效时没有飞行格', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce', locale: 'zh-CN' })).newPage();
  await start(page);
  await page.fill('input[name=monthlySpend]', '15000');
  await page.click('#next');
  await page.waitForTimeout(80);
  expect(await page.locator('.fly').count()).toBe(0);
  await expect(page.locator('#cellCount')).toHaveText('144 格');
});

test('答第二题时换档并继续飞入', async ({ page }) => {
  await start(page);
  await page.fill('input[name=monthlySpend]', '15000');
  await page.click('#next');
  await expect(page.locator('.fly')).toHaveCount(0, { timeout: 3000 });
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.fill('input[name=perKid]', '150');
  await page.click('#next');
  await page.waitForTimeout(120);
  expect(await page.locator('.fly').count()).toBeGreaterThan(0);
  await expect(page.locator('#unit')).toHaveText('一格 = 10 万');
  await expect(page.locator('#cellCount')).toHaveText('102 格');
});
