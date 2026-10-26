import type { Page } from '@playwright/test';

export async function start(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: '开始', exact: true }).click();
}

// 按视频例子 1 填完四题，停在结果页
export async function answerVideoExample(page: Page) {
  await start(page);
  await page.fill('input[name=monthlySpend]', '15000');
  await page.click('#next');
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.fill('input[name=perKid]', '150');
  await page.click('#next');
  await page.fill('input[name=medical]', '150');
  await page.click('#next');
  await page.getByRole('button', { name: '打算买一套' }).click();
  await page.fill('input[name=house]', '700');
  await page.click('#next');
}
