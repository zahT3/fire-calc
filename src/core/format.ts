import { PART_KEYS, type Breakdown, type Locale, type PartKey } from './types';

const num = (n: number, decimals: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// 最多一位小数，去掉末尾的 .0
const short = (n: number) => num(Math.round(n * 10) / 10, Number.isInteger(Math.round(n * 10) / 10) ? 0 : 1);

export function formatMoney(yuan: number, locale: Locale): string {
  if (locale === 'zh') return yuan >= 1e4 ? `${short(yuan / 1e4)} 万` : `¥${num(yuan, 0)}`;
  if (yuan >= 1e6) return `¥${short(yuan / 1e6)}M`;
  if (yuan >= 1e4) return `¥${short(yuan / 1e3)}K`;
  return `¥${num(yuan, 0)}`;
}

function scaled(yuan: number, locale: Locale, decimals: number): string {
  return locale === 'zh' ? `${num(yuan / 1e4, decimals)} 万` : `¥${num(yuan / 1e6, decimals)}M`;
}

// 竖式要能加得上：先用最少的小数位，分项之和对不上总额就多保留一位，仍对不上则标为约数
export function formatBreakdown(parts: Breakdown, total: number, locale: Locale): {
  parts: Record<PartKey, string>; total: string; approx: boolean;
} {
  const unit = locale === 'zh' ? 1e4 : 1e6;
  const base = locale === 'zh' ? 0 : 1;
  let decimals = base;
  let approx = true;
  for (const d of [base, base + 1]) {
    const f = 10 ** d;
    const sum = PART_KEYS.reduce((s, k) => s + Math.round((parts[k] / unit) * f), 0);
    decimals = d;
    if (sum === Math.round((total / unit) * f)) { approx = false; break; }
  }
  const out = Object.fromEntries(PART_KEYS.map((k) => [k, scaled(parts[k], locale, decimals)])) as Record<PartKey, string>;
  return { parts: out, total: scaled(total, locale, decimals), approx };
}
