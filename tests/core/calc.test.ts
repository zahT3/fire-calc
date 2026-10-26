import { computeTarget, monthlyAffordable } from '../../src/core/calc';
import type { Inputs } from '../../src/core/types';

const video: Inputs = {
  monthlySpend: 15000, kids: 2, perKid: 1_500_000, medical: 1_500_000,
  housing: 'buy', house: 7_000_000, nominalReturn: 0.045, inflation: 0.02,
};

test('视频例子 1：1870 万', () => {
  const r = computeTarget(video);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.multiplier).toBeCloseTo(480);
  expect(r.total).toBeCloseTo(18_700_000);
  expect(r.parts.living).toBeCloseTo(7_200_000);
  expect(r.parts).toMatchObject({ kids: 3_000_000, medical: 1_500_000, house: 7_000_000 });
});

test('视频例子 2：600 万反算每月 1 万', () => {
  const r = monthlyAffordable(6_000_000, { ...video, kids: 1, perKid: 700_000, medical: 500_000, housing: 'rent' });
  expect(r).toEqual({ ok: true, free: 4_800_000, monthly: expect.closeTo(10_000, 6) });
});

test('include 只算已答分项', () => {
  const r = computeTarget(video, ['living']);
  expect(r.ok && r.total).toBeCloseTo(7_200_000);
});

test('住房 own / rent 时 H 不计入，孩子数 0 时 K 不计入', () => {
  const own = computeTarget({ ...video, housing: 'own', kids: 0 });
  expect(own.ok && own.parts.house).toBe(0);
  expect(own.ok && own.parts.kids).toBe(0);
  const rent = computeTarget({ ...video, housing: 'rent' });
  expect(rent.ok && rent.parts.house).toBe(0);
});

test('实际回报 ≤ 0 返回错误', () => {
  expect(computeTarget({ ...video, nominalReturn: 0.02 })).toEqual({ ok: false, reason: 'non-positive-real-return' });
  expect(computeTarget({ ...video, nominalReturn: 0.01 })).toEqual({ ok: false, reason: 'non-positive-real-return' });
});

test('实际回报 ≤ 0 但月开销为 0 仍可计算', () => {
  const r = computeTarget({ ...video, monthlySpend: 0, nominalReturn: 0.01 });
  expect(r.ok && r.total).toBeCloseTo(11_500_000);
  expect(r.ok && r.multiplier).toBe(0);
});

test('预留等于 / 超过资产', () => {
  const i = { ...video, kids: 1, perKid: 700_000, medical: 500_000, housing: 'rent' as const };
  expect(monthlyAffordable(1_200_000, i)).toEqual({ ok: false, reason: 'reserves-equal-assets' });
  expect(monthlyAffordable(1_000_000, i)).toEqual({ ok: false, reason: 'reserves-exceed-assets' });
});

test('反算在实际回报 ≤ 0 时返回错误', () => {
  expect(monthlyAffordable(6_000_000, { ...video, nominalReturn: 0.02 })).toEqual({ ok: false, reason: 'non-positive-real-return' });
});

test('默认假设下乘数精确等于 480，资产刚好够时没有浮点尾差', () => {
  const r = computeTarget(video);
  expect(r.ok && r.multiplier).toBe(480);
  const rent = computeTarget({ ...video, monthlySpend: 10000, kids: 1, perKid: 700_000, medical: 500_000, housing: 'rent' });
  expect(rent.ok && rent.total).toBe(6_000_000);
});
