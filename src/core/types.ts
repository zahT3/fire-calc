// 金额一律用元；回报率、通胀用小数（0.045 = 4.5%）
export type Housing = 'own' | 'rent' | 'buy';

export type Locale = 'zh' | 'en';

export type PartKey = 'living' | 'kids' | 'medical' | 'house';
export const PART_KEYS: readonly PartKey[] = ['living', 'kids', 'medical', 'house'];

export interface Inputs {
  monthlySpend: number;
  kids: number;
  perKid: number;
  medical: number;
  housing: Housing;
  house: number;
  nominalReturn: number;
  inflation: number;
}

export type Breakdown = Record<PartKey, number>;

export type TargetResult =
  | { ok: true; realReturn: number; multiplier: number; parts: Breakdown; total: number }
  | { ok: false; reason: 'non-positive-real-return' };

export type AffordResult =
  | { ok: true; monthly: number; free: number }
  | { ok: false; reason: 'non-positive-real-return' | 'reserves-exceed-assets' | 'reserves-equal-assets' };

export const DEFAULT_RETURN = 0.045;
export const DEFAULT_INFLATION = 0.02;
