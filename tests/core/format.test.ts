import { formatBreakdown, formatMoney } from '../../src/core/format';

test('zh 金额', () => {
  expect(formatMoney(18_700_000, 'zh')).toBe('1,870 万');
  expect(formatMoney(1_435_000, 'zh')).toBe('143.5 万');
  expect(formatMoney(2456, 'zh')).toBe('¥2,456');
});

test('en 金额', () => {
  expect(formatMoney(18_700_000, 'en')).toBe('¥18.7M');
  expect(formatMoney(3_000_000, 'en')).toBe('¥3M');
  expect(formatMoney(580_000, 'en')).toBe('¥580K');
  expect(formatMoney(2456, 'en')).toBe('¥2,456');
});

test('视频例子竖式用整数万', () => {
  const r = formatBreakdown({ living: 7_200_000, kids: 3_000_000, medical: 1_500_000, house: 7_000_000 }, 18_700_000, 'zh');
  expect(r).toEqual({ parts: { living: '720 万', kids: '300 万', medical: '150 万', house: '700 万' }, total: '1,870 万', approx: false });
});

test('竖式加得上：整数对不上时多保留一位', () => {
  const p = { living: 1_004_000, kids: 1_004_000, medical: 1_004_000, house: 1_004_000 };
  const r = formatBreakdown(p, 4_016_000, 'zh');
  expect(r.parts.living).toBe('100.4 万');
  expect(r.total).toBe('401.6 万');
  expect(r.approx).toBe(false);
});

test('一位小数仍对不上时标为约数', () => {
  const p = { living: 1_004_400, kids: 1_004_400, medical: 1_004_400, house: 0 };
  const r = formatBreakdown(p, 3_013_200, 'zh');
  expect(r.approx).toBe(true);
});
