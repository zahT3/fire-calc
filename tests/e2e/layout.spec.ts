import { expect, test, type Page } from '@playwright/test';
import { answerVideoExample, start } from './helpers';

const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test('每一屏都没有横向溢出，并留截图', async ({ page }, info) => {
  const shot = async (name: string) => {
    await expect(page.locator('.fly')).toHaveCount(0, { timeout: 3000 });
    await page.waitForTimeout(700);
    expect(await noOverflow(page), name).toBe(true);
    await page.screenshot({ path: `tests/e2e/__shots__/${info.project.name}-${name}.png`, fullPage: true });
  };
  await page.goto('/');
  await shot('0-intro');
  await page.getByRole('button', { name: '开始', exact: true }).click();
  await shot('1-living');
  await page.fill('input[name=monthlySpend]', '15000');
  await page.click('#next');
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.fill('input[name=perKid]', '150');
  await shot('2-kids');
  await page.click('#next');
  await page.fill('input[name=medical]', '150');
  await page.click('#next');
  await page.getByRole('button', { name: '打算买一套' }).click();
  await page.fill('input[name=house]', '700');
  await shot('4-house');
  await page.click('#next');
  await expect(page.locator('#total')).toHaveText('1,870 万');
  await expect(page.locator('.fly')).toHaveCount(0, { timeout: 3000 });
  await shot('5-result');
  await page.getByRole('button', { name: '我现在有多少？' }).click();
  await page.fill('input[name=assets]', '600');
  await shot('6-progress');
});

test('小屏 375×667 聚焦输入时下一步可见', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await start(page);
  await page.fill('input[name=monthlySpend]', '15000');
  await page.click('#next');
  await page.getByRole('button', { name: '2', exact: true }).click();
  await page.fill('input[name=perKid]', '150');
  await page.click('#next');
  await page.locator('input[name=medical]').focus();
  const box = await page.locator('#next').boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(667);
});

test('只用键盘走完四题', async ({ page }, info) => {
  // macOS Safari 默认 Tab 只在输入框间跳转（按钮需 Option+Tab），这是平台行为
  test.skip(info.project.name === 'mobile-webkit');
  await start(page);
  await page.keyboard.press('Tab');
  await page.keyboard.type('15000');
  await page.keyboard.press('Enter');
  await expect(page.locator('h2')).toHaveText('几个孩子？');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '2', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.locator('input[name=perKid]')).toBeFocused();
  await page.keyboard.type('150');
  await page.keyboard.press('Enter');
  await expect(page.locator('h2')).toHaveText('这辈子的医疗费，留多少？');
  await page.keyboard.press('Tab');
  await page.keyboard.type('150');
  await page.keyboard.press('Enter');
  await expect(page.locator('h2')).toHaveText('住房怎么打算？');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '打算买一套' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await page.keyboard.type('700');
  await page.keyboard.press('Enter');
  await expect(page.locator('#total')).toHaveText('1,870 万');
});

test('全流程无控制台错误', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await answerVideoExample(page);
  await page.getByRole('button', { name: '我现在有多少？' }).click();
  await page.fill('input[name=assets]', '600');
  await page.getByRole('button', { name: '回到结果' }).click();
  await page.getByRole('button', { name: '重新开始' }).click();
  expect(errors).toEqual([]);
});

test('电脑版方格占满右栏', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await answerVideoExample(page);
  const grid = await page.locator('#grid').boundingBox();
  expect(grid!.width).toBeGreaterThan(560);
  const stage = await page.locator('#stage').boundingBox();
  expect(grid!.x).toBeGreaterThan(stage!.x + stage!.width);
});

test('结果变化通过 aria-live 播报最终总额', async ({ page }) => {
  await answerVideoExample(page);
  await expect(page.locator('#live')).toHaveText(/1,870 万/);
});
