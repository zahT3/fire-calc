import { PART_KEYS, type Breakdown } from './types';

const MANTISSAS = [1, 2, 5];
const WAN = 10_000;

// 每格面值取 {1,2,5}×10ⁿ 万元中最小、且让格数不超过 maxCells 的一档，档位不设上限
export function pickUnit(totalYuan: number, maxCells = 200): number {
  if (!Number.isFinite(totalYuan)) throw new RangeError('total must be finite');
  if (totalYuan <= 0) return WAN;
  for (let pow = 1; ; pow *= 10) {
    for (const m of MANTISSAS) {
      const unit = m * pow * WAN;
      if (Math.ceil(totalYuan / unit) <= maxCells) return unit;
    }
  }
}

// 先定总格数，再按最大余数法分给各项，避免各项分别四舍五入后加起来超出总格数
export function allocateCells(parts: Breakdown, unit: number): { counts: Breakdown; cells: number } {
  const total = PART_KEYS.reduce((s, k) => s + parts[k], 0);
  const counts: Breakdown = { living: 0, kids: 0, medical: 0, house: 0 };
  const cells = total > 0 ? Math.round(total / unit) : 0;
  if (cells === 0) return { counts, cells };

  const exact = PART_KEYS.map((k) => ({ k, share: (parts[k] / total) * cells }));
  for (const e of exact) counts[e.k] = Math.floor(e.share);
  let left = cells - PART_KEYS.reduce((s, k) => s + counts[k], 0);
  const byRemainder = [...exact].sort((a, b) => (b.share % 1) - (a.share % 1));
  for (const e of byRemainder) {
    if (left <= 0) break;
    counts[e.k] += 1;
    left -= 1;
  }
  return { counts, cells };
}

// 达标只看原始金额；没达标时不让取整把进度显示成全亮或 100%
export function progressCells(assets: number, total: number, cells: number): { lit: number; reached: boolean; percent: number } {
  const reached = assets >= total;
  if (reached) return { lit: cells, reached, percent: 100 };
  // 先乘后除，避免 1000 万 ÷ 1870 万 × 187 因浮点误差少算一格
  const a = Math.max(assets, 0);
  return {
    lit: Math.max(0, Math.min(cells - 1, Math.floor((a * cells) / total))),
    reached,
    percent: Math.min(99, Math.floor((a * 100) / total)),
  };
}
