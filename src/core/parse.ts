export type FieldKey =
  | 'monthlySpend' | 'kids' | 'perKid' | 'medical' | 'house' | 'assets' | 'nominalReturn' | 'inflation';
export type ParseError = 'empty' | 'invalid' | 'negative' | 'too-large';
export type Parsed = { ok: true; value: number } | { ok: false; error: ParseError };

type FieldUnit = 'yuan' | 'wan' | 'count' | 'percent';
const UNIT: Record<FieldKey, FieldUnit> = {
  monthlySpend: 'yuan', kids: 'count', perKid: 'wan', medical: 'wan', house: 'wan', assets: 'wan',
  nominalReturn: 'percent', inflation: 'percent',
};

// 核心单位（元 / 个 / 小数）下的上限
export const LIMITS: Record<FieldKey, number> = {
  monthlySpend: 10_000_000, kids: 20, perKid: 1e9, medical: 1e9, house: 1e11, assets: 1e11,
  nominalReturn: 0.3, inflation: 0.3,
};

// 千分位逗号必须是三位一组，"1,5" 这类写法判为非法而不是猜成 15
const NUMBER = /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/;

function toHalfWidth(s: string): string {
  return s.replace(/[０-９．，－]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

export function parseField(field: FieldKey, text: string): Parsed {
  let s = toHalfWidth(text).trim().replace(/\s+/g, '');
  if (s === '') return { ok: false, error: 'empty' };

  const negative = s.startsWith('-');
  if (negative) s = s.slice(1);

  const unit = UNIT[field];
  let scale = unit === 'yuan' ? 1 : unit === 'wan' ? 1e4 : unit === 'percent' ? 0.01 : 1;
  const suffix = s.at(-1);
  if (suffix === '万' || suffix === '亿') {
    if (unit !== 'yuan' && unit !== 'wan') return { ok: false, error: 'invalid' };
    s = s.slice(0, -1);
    // 带了中文单位就按字面换算成元，与字段默认单位无关（万元字段里写"150万"同样是 150 万元）
    scale = suffix === '万' ? 1e4 : 1e8;
  } else if (suffix === '%' && unit === 'percent') {
    s = s.slice(0, -1);
  }

  if (!NUMBER.test(s)) return { ok: false, error: 'invalid' };
  const n = Number(s.replace(/,/g, ''));
  if (unit === 'count' && !Number.isInteger(n)) return { ok: false, error: 'invalid' };
  // 百分数用除法，避免 4.5 × 0.01 得到 0.045000000000000005
  const value = unit === 'percent' ? n / 100 : n * scale;
  if (!Number.isFinite(value)) return { ok: false, error: 'invalid' };
  if (negative && value !== 0) return { ok: false, error: 'negative' };
  if (value > LIMITS[field]) return { ok: false, error: 'too-large' };
  return { ok: true, value };
}
