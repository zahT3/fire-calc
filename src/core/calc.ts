import { PART_KEYS, type AffordResult, type Breakdown, type Inputs, type PartKey, type TargetResult } from './types';

function reserves(i: Inputs): Omit<Breakdown, 'living'> {
  return {
    kids: i.kids > 0 ? i.kids * i.perKid : 0,
    medical: i.medical,
    house: i.housing === 'buy' ? i.house : 0,
  };
}

// 视频公式：乘数 × 月开销 + 孩子 × 每孩 + 医疗 + 住房；乘数 = 12 ÷ (回报 − 通胀)
export function computeTarget(i: Inputs, include: readonly PartKey[] = PART_KEYS): TargetResult {
  const realReturn = i.nominalReturn - i.inflation;
  const needsLiving = include.includes('living') && i.monthlySpend > 0;
  if (needsLiving && realReturn <= 0) return { ok: false, reason: 'non-positive-real-return' };

  const multiplier = realReturn > 0 ? 12 / realReturn : 0;
  const all: Breakdown = { living: needsLiving ? multiplier * i.monthlySpend : 0, ...reserves(i) };
  const parts = Object.fromEntries(PART_KEYS.map((k) => [k, include.includes(k) ? all[k] : 0])) as Breakdown;
  const total = PART_KEYS.reduce((sum, k) => sum + parts[k], 0);
  return { ok: true, realReturn, multiplier, parts, total };
}

export function monthlyAffordable(assets: number, i: Inputs): AffordResult {
  const realReturn = i.nominalReturn - i.inflation;
  if (realReturn <= 0) return { ok: false, reason: 'non-positive-real-return' };
  const r = reserves(i);
  const free = assets - r.kids - r.medical - r.house;
  if (free === 0) return { ok: false, reason: 'reserves-equal-assets' };
  if (free < 0) return { ok: false, reason: 'reserves-exceed-assets' };
  return { ok: true, monthly: (free * realReturn) / 12, free };
}
