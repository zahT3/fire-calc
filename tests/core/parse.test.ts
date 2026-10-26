import { parseField, type FieldKey } from '../../src/core/parse';

test.each([
  ['monthlySpend', '15000', 15000],
  ['monthlySpend', '15,000', 15000],
  ['monthlySpend', '１５０００', 15000],
  ['monthlySpend', '１５，０００', 15000],
  ['monthlySpend', '1.5万', 15000],
  ['monthlySpend', ' 8000 ', 8000],
  ['monthlySpend', '0', 0],
  ['perKid', '150', 1_500_000],
  ['perKid', '150万', 1_500_000],
  ['house', '1.2亿', 120_000_000],
  ['assets', '600', 6_000_000],
  ['kids', '2', 2],
  ['nominalReturn', '4.5', 0.045],
  ['inflation', '2', 0.02],
])('%s "%s" → %d', (f, t, v) => {
  expect(parseField(f as FieldKey, t)).toEqual({ ok: true, value: expect.closeTo(v as number, 6) });
});

test.each([
  ['monthlySpend', '', 'empty'],
  ['monthlySpend', '   ', 'empty'],
  ['monthlySpend', 'abc', 'invalid'],
  ['monthlySpend', '1,5', 'invalid'],
  ['monthlySpend', '-1', 'negative'],
  ['monthlySpend', '1e309', 'invalid'],
  ['monthlySpend', '20000000', 'too-large'],
  ['kids', '1.5', 'invalid'],
  ['kids', '21', 'too-large'],
  ['nominalReturn', '31', 'too-large'],
  ['perKid', '1万万', 'invalid'],
])('%s "%s" → %s', (f, t, e) => {
  expect(parseField(f as FieldKey, t)).toEqual({ ok: false, error: e });
});
