import { allocateCells, pickUnit, progressCells } from '../../src/core/cells';

test('1870 万 → 一格 10 万，187 格，各项 72/30/15/70', () => {
  const parts = { living: 7_200_000, kids: 3_000_000, medical: 1_500_000, house: 7_000_000 };
  const u = pickUnit(18_700_000);
  expect(u).toBe(100_000);
  expect(allocateCells(parts, u)).toEqual({ cells: 187, counts: { living: 72, kids: 30, medical: 15, house: 70 } });
});

test('小金额用最小档：143.5 万 → 一格 1 万', () => expect(pickUnit(1_435_000)).toBe(10_000));
test('总额为 0 → 一格 1 万', () => expect(pickUnit(0)).toBe(10_000));
test('档位动态扩展：100 亿 → 一格 5000 万', () => expect(pickUnit(1e10)).toBe(5e7));

test('各项独立取整不会超额', () => {
  const r = allocateCells({ living: 996_000, kids: 996_000, medical: 5_000, house: 3_000 }, 10_000);
  expect(r.cells).toBe(200);
  expect(Object.values(r.counts).reduce((a, b) => a + b)).toBe(200);
});

test('总额为 0 时没有格子', () => {
  expect(allocateCells({ living: 0, kids: 0, medical: 0, house: 0 }, 10_000)).toEqual({ cells: 0, counts: { living: 0, kids: 0, medical: 0, house: 0 } });
});

test('差 1 万不显示全亮和 100%', () => {
  expect(progressCells(18_690_000, 18_700_000, 187)).toEqual({ lit: 186, reached: false, percent: 99 });
});
test('刚好够时全亮 100%', () => {
  expect(progressCells(18_700_000, 18_700_000, 187)).toEqual({ lit: 187, reached: true, percent: 100 });
});
test('一半资产点亮一半', () => {
  expect(progressCells(9_350_000, 18_700_000, 187)).toEqual({ lit: 93, reached: false, percent: 50 });
});

test('非有限值抛错', () => {
  expect(() => pickUnit(Infinity)).toThrow(RangeError);
  expect(() => pickUnit(NaN)).toThrow(RangeError);
});
