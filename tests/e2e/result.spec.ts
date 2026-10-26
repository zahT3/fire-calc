import { expect, test, type Page } from '@playwright/test';
import { answerVideoExample } from './helpers';

async function demo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '先用视频的例子看一遍' }).click();
}

test('视频示例：1870 万，竖式四行带公式字母，标注视频示例', async ({ page }) => {
  await demo(page);
  await expect(page.locator('#total')).toHaveText('1,870 万');
  await expect(page.locator('button.row')).toHaveCount(4);
  await expect(page.locator('.rsum')).toContainText('1,870 万');
  await expect(page.getByText('480X')).toBeVisible();
  await expect(page.getByText('视频示例')).toBeVisible();
  await expect(page.locator('#cellCount')).toHaveText('187 格');
});

test('改住房为已有房，买房一项归零', async ({ page }) => {
  await demo(page);
  await page.getByRole('button', { name: /修改住房/ }).click();
  await page.getByRole('button', { name: '已经有房 / 不需要' }).click();
  await page.getByRole('button', { name: '完成' }).click();
  await expect(page.locator('#total')).toHaveText('1,170 万');
  await expect(page.locator('button.row').nth(3)).toContainText('住房（已有）');
});

test('改孩子数为 0，孩子一项归零', async ({ page }) => {
  await demo(page);
  await page.getByRole('button', { name: /修改孩子/ }).click();
  await page.getByRole('button', { name: '0', exact: true }).click();
  await page.getByRole('button', { name: '完成' }).click();
  await expect(page.locator('#total')).toHaveText('1,570 万');
  await expect(page.locator('button.row').nth(1)).toContainText('孩子（无）');
});

test('假设里改回报，乘数和总额跟着变', async ({ page }) => {
  await demo(page);
  await page.getByText('这个数是怎么来的').click();
  await page.fill('input[name=nominalReturn]', '5');
  await expect(page.locator('#assumeBody')).toContainText('= 400');
  await expect(page.locator('#total')).toHaveText('1,750 万');
});

test('回报改成 2% 显示无法达到，不出数字', async ({ page }) => {
  await demo(page);
  await page.getByText('这个数是怎么来的').click();
  await page.fill('input[name=nominalReturn]', '2');
  await expect(page.getByText(/钱总有花完的一天/)).toBeVisible();
  await expect(page.locator('button.row')).toHaveCount(0);
  await expect(page.locator('#total')).toHaveText('—');
});

test('示例路径重新开始后输入为空', async ({ page }) => {
  await demo(page);
  await page.getByRole('button', { name: '重新开始' }).click();
  await expect(page.locator('h2')).toHaveText('每月想花多少？');
  await expect(page.locator('input[name=monthlySpend]')).toHaveValue('');
});

test('自己算的重新开始保留输入，方格清空', async ({ page }) => {
  await answerVideoExample(page);
  await expect(page.locator('#total')).toHaveText('1,870 万');
  await page.getByRole('button', { name: '重新开始' }).click();
  await expect(page.locator('input[name=monthlySpend]')).toHaveValue('15000');
  await expect(page.locator('#cellCount')).toHaveText('');
  await expect(page.getByText('视频示例')).toHaveCount(0);
});
