import { expect, test, type Page } from '@playwright/test';

async function demoProgress(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '先用视频的例子看一遍' }).click();
  await page.getByRole('button', { name: '我现在有多少？' }).click();
}

test('视频反算：链接直达，600 万 → 每月约 ¥10,000', async ({ page }) => {
  await page.goto('/?v=1&x=10000&n=1&k=70&m=50&hs=rent&a=600');
  await expect(page.locator('#total')).toHaveText('600 万');
  await page.getByRole('button', { name: '我现在有多少？' }).click();
  await expect(page.locator('input[name=assets]')).toHaveValue('600');
  await expect(page.locator('#afford')).toContainText('¥10,000');
  await expect(page.locator('#gap')).toHaveText('刚好够');
});

test('差 1 万不显示 100%，点亮格数与文字一致', async ({ page }) => {
  await demoProgress(page);
  await page.fill('input[name=assets]', '1869');
  await expect(page.locator('#progressLine')).toHaveText('已点亮 186 / 187 格 · 99%');
  await expect(page.locator('#gap')).toHaveText('还差 1 万');
  await expect(page.locator('#grid i.lit')).toHaveCount(186);
});

test('一半资产点亮一半', async ({ page }) => {
  await demoProgress(page);
  await page.getByRole('button', { name: '1,000 万' }).click();
  await expect(page.locator('#progressLine')).toHaveText('已点亮 100 / 187 格 · 53%');
});

test('预留超过资产时给出说明', async ({ page }) => {
  await demoProgress(page);
  await page.fill('input[name=assets]', '1000');
  await expect(page.locator('#afford')).toHaveText('孩子、医疗、住房的预留已经超过这笔钱。');
});

test('在这一页把回报改到不高于通胀，只显示说明', async ({ page }) => {
  await demoProgress(page);
  await page.fill('input[name=assets]', '600');
  await page.getByText('这个数是怎么来的').click();
  await page.fill('input[name=nominalReturn]', '2');
  await expect(page.locator('#afford')).toContainText('钱总有花完的一天');
  await expect(page.locator('#progressLine')).toBeHidden();
  await expect(page.locator('#afford')).not.toContainText('¥');
});

test('回到结果', async ({ page }) => {
  await demoProgress(page);
  await page.getByRole('button', { name: '回到结果' }).click();
  await expect(page.locator('button.row')).toHaveCount(4);
});
