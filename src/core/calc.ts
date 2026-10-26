import { PART_KEYS, type AffordResult, type Breakdown, type Inputs, type PartKey, type TargetResult } from './types';

// 0.045 − 0.02 在浮点下是 0.024999999999999998，会让乘数变成 480.00000000000006；
// 回报率只需要 10 位小数精度，先取整再算
const realReturnOf = (i: Inputs) => Math.round((i.nominalReturn - i.inflation) * 1e10) / 1e10;

function reserves(i: Inputs): Omit<Breakdown, 'living'> {
  return {
    kids: i.kids > 0 ? i.kids * i.perKid : 0,
    medical: i.medical,
    house: i.housing === 'buy' ? i.house : 0,
  };
}

// 视频公式：乘数 × 月开销 + 孩子 × 每孩 + 医疗 + 住房；乘数 = 12 ÷ (回报 − 通胀)
export function computeTarget(i: Inputs, include: readonly PartKey[] = PART_KEYS): TargetResult {
  const realReturn = realReturnOf(i);
  const needsLiving = include.includes('living') && i.monthlySpend > 0;
  if (needsLiving && realReturn <= 0) return { ok: false, reason: 'non-positive-real-return' };

  const multiplier = realReturn > 0 ? 12 / realReturn : 0;
  const all: Breakdown = { living: needsLiving ? multiplier * i.monthlySpend : 0, ...reserves(i) };
  const parts = Object.fromEntries(PART_KEYS.map((k) => [k, include.includes(k) ? all[k] : 0])) as Breakdown;
  const total = PART_KEYS.reduce((sum, k) => sum + parts[k], 0);
  return { ok: true, realReturn, multiplier, parts, total };
}

export function monthlyAffordable(assets: number, i: Inputs): AffordResult {
  const realReturn = realReturnOf(i);
  if (realReturn <= 0) return { ok: false, reason: 'non-positive-real-return' };
  const r = reserves(i);
  const free = assets - r.kids - r.medical - r.house;
  if (free === 0) return { ok: false, reason: 'reserves-equal-assets' };
  if (free < 0) return { ok: false, reason: 'reserves-exceed-assets' };
  return { ok: true, monthly: (free * realReturn) / 12, free };
}
