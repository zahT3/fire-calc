import { expect, test } from '@playwright/test';
import { start } from './helpers';

test('开场页有开始和视频示例入口', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('你需要多少钱，才能财富自由？');
  await expect(page.getByRole('button', { name: '先用视频的例子看一遍' })).toBeVisible();
});

test('空输入时下一步禁用，点参考值后可用', async ({ page }) => {
  await start(page);
  await expect(page.locator('input[name=monthlySpend]')).toHaveValue('');
  await expect(page.locator('#next')).toBeDisabled();
  await page.getByRole('button', { name: /城镇平均 2,990/ }).click();
  await expect(page.locator('input[name=monthlySpend]')).toHaveValue('2990');
  await expect(page.locator('#next')).toBeEnabled();
});

test('非法输入显示错误，不按 0 算', async ({ page }) => {
  await start(page);
  await page.fill('input[name=monthlySpend]', 'abc');
  await expect(page.getByRole('alert')).toHaveText('这不像一个数字');
  await expect(page.locator('#next')).toBeDisabled();
});

test('返回键回到上一题', async ({ page }) => {
  await start(page);
  await page.fill('input[name=monthlySpend]', '15000');
  await page.click('#next');
  await expect(page.locator('h2')).toHaveText('几个孩子？');
  await page.goBack();
  await expect(page.locator('h2')).toHaveText('每月想花多少？');
  await expect(page.locator('input[name=monthlySpend]')).toHaveValue('15000');
});

test('点叠卡条回到该题', async ({ page }) => {
  await start(page);
  await page.fill('input[name=monthlySpend]', '15000');
  await page.click('#next');
  await page.locator('button.tab').first().click();
  await expect(page.locator('h2')).toHaveText('每月想花多少？');
});

test('孩子选 0 跳过金额，选 4+ 出现孩子数输入框', async ({ page }) => {
  await start(page);
  await page.fill('input[name=monthlySpend]', '8000');
  await page.click('#next');
  await page.getByRole('button', { name: '0', exact: true }).click();
  await expect(page.locator('input[name=perKid]')).toBeHidden();
  await expect(page.locator('#next')).toBeEnabled();
  await page.getByRole('button', { name: '4+', exact: true }).click();
  await page.fill('input[name=kids]', '5');
  await page.fill('input[name=perKid]', '58');
  await expect(page.locator('#next')).toBeEnabled();
});

test('切题后焦点在题目标题上', async ({ page }) => {
  await start(page);
  await page.fill('input[name=monthlySpend]', '15000');
  await page.click('#next');
  await expect(page.locator('h2')).toBeFocused();
});

test('英文开场页显示 Based on China data', async ({ browser }) => {
  const page = await (await browser.newContext({ locale: 'en-US' })).newPage();
  await page.goto('/');
  await expect(page.getByText('Based on China data, amounts in CNY')).toBeVisible();
});
