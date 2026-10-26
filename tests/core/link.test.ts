import { decodeLink, encodeLink } from '../../src/core/link';

test('往返', () => {
  const s = {
    inputs: { monthlySpend: 15000, kids: 2, perKid: 1_500_000, medical: 1_500_000, housing: 'buy' as const, house: 7_000_000 },
    lang: 'en' as const,
  };
  expect(decodeLink(encodeLink(s))).toEqual(s);
});

test('带假设、资产和示例标记的往返', () => {
  const s = { inputs: { monthlySpend: 10000, nominalReturn: 0.05, inflation: 0.025 }, assets: 6_000_000, demo: true };
  expect(decodeLink(encodeLink(s))).toEqual(s);
});

test('编码固定带版本号，金额按界面单位写', () => {
  const q = new URLSearchParams(encodeLink({ inputs: { monthlySpend: 15000, perKid: 1_500_000, nominalReturn: 0.045 } }));
  expect(q.get('v')).toBe('1');
  expect(q.get('x')).toBe('15000');
  expect(q.get('k')).toBe('150');
  expect(q.get('r')).toBe('4.5');
});

test('非法字段丢弃，未知键忽略', () => {
  expect(decodeLink('v=1&x=-5&n=abc&k=150&hs=castle&lang=fr&zz=1')).toEqual({ inputs: { perKid: 1_500_000 } });
});

test('前导问号也能解析', () => {
  expect(decodeLink('?v=1&x=8000')).toEqual({ inputs: { monthlySpend: 8000 } });
});

test('版本不符返回空', () => {
  expect(decodeLink('v=9&x=15000')).toEqual({});
  expect(decodeLink('x=15000')).toEqual({});
});
