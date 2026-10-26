import { computeTarget, monthlyAffordable } from '../core/calc';
import { allocateCells, pickUnit, progressCells } from '../core/cells';
import { formatBreakdown, formatMoney } from '../core/format';
import { PART_KEYS, type Inputs, type Locale, type PartKey } from '../core/types';
import { t as translate, type MessageKey } from '../i18n';

// ANSI 256 色里最接近网页四种颜色的色号
const ANSI: Record<PartKey, number> = { living: 155, kids: 216, medical: 152, house: 223 };
const COLS = 20;

const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/u;
// 中文在终端占两格，对齐要按显示宽度算
export const displayWidth = (s: string) => [...s].reduce((w, c) => w + (WIDE.test(c) ? 2 : 1), 0);
const padEnd = (s: string, w: number) => s + ' '.repeat(Math.max(0, w - displayWidth(s)));
const padStart = (s: string, w: number) => ' '.repeat(Math.max(0, w - displayWidth(s))) + s;

function rowLabel(i: Inputs, part: PartKey, t: (k: MessageKey, v?: Record<string, string | number>) => string, locale: Locale): string {
  const money = (v: number) => formatMoney(v, locale);
  if (part === 'living') return t('result.living', { v: money(i.monthlySpend) });
  if (part === 'kids') return i.kids ? t('result.kids', { n: i.kids, v: money(i.perKid) }) : t('result.kidsNone');
  if (part === 'medical') return t('result.medical');
  return t(i.housing === 'buy' ? 'result.house' : i.housing === 'own' ? 'result.houseOwn' : 'result.houseRent');
}

export function renderTerminal(inputs: Inputs, locale: Locale, opts: { color: boolean; assets?: number }): string {
  const t = (k: MessageKey, v?: Record<string, string | number>) => translate(locale, k, v);
  const paint = (s: string, code: number, bold = false) => (opts.color ? `\x1b[${bold ? '1;' : ''}38;5;${code}m${s}\x1b[0m` : s);
  const dim = (s: string) => (opts.color ? `\x1b[2m${s}\x1b[0m` : s);
  const out: string[] = [t('app.title')];
  const note = t('region.note');
  if (note) out.push(dim(note));
  out.push('');

  const r = computeTarget(inputs);
  if (!r.ok) {
    out.push(t('result.nonPositive'));
    return out.join('\n') + '\n';
  }
  out.push(`${t('top.result')}  ${paint(formatMoney(r.total, locale), ANSI.living, true)}`, '');

  const unit = pickUnit(r.total);
  const { counts, cells } = allocateCells(r.parts, unit);
  const owner = PART_KEYS.flatMap((k) => Array<PartKey>(counts[k]).fill(k));
  const lit = opts.assets === undefined ? null : progressCells(opts.assets, r.total, cells);
  for (let row = 0; row * COLS < cells; row++) {
    out.push(owner.slice(row * COLS, row * COLS + COLS).map((k, i) => {
      const idx = row * COLS + i;
      return lit && idx >= lit.lit ? dim('□') : paint('■', ANSI[k]);
    }).join(' '));
  }
  out.push(dim(`${t('board.unit', { v: formatMoney(unit, locale) })} · ${t('board.cells', { n: cells })}`), '');

  const f = formatBreakdown(r.parts, r.total, locale);
  const sym: Record<PartKey, string> = { living: `${Math.round(r.multiplier)}X`, kids: 'K × n', medical: 'M', house: 'H' };
  const labels = PART_KEYS.map((k) => rowLabel(inputs, k, t, locale));
  const lw = Math.max(...labels.map(displayWidth));
  const vw = Math.max(...PART_KEYS.map((k) => displayWidth(f.parts[k])), displayWidth(f.total));
  PART_KEYS.forEach((k, i) => {
    out.push(`${i ? '+' : ' '} ${paint('■', ANSI[k])} ${padEnd(labels[i]!, lw)}  ${dim(padEnd(sym[k], 6))}${padStart(f.parts[k], vw)}`);
  });
  const total = `${f.approx ? `${t('result.approx')} ` : ''}${f.total}`;
  out.push(`= ${padEnd(t('result.sum'), lw + 2)}  ${' '.repeat(6)}${paint(padStart(total, vw), ANSI.living, true)}`);
  out.push('', dim(`${t('share.assume', { r: Number((r.realReturn * 100).toFixed(2)), m: Math.round(r.multiplier) })} · ${t('result.basis')}`));

  if (opts.assets !== undefined && lit) {
    const diff = r.total - opts.assets;
    out.push('', `${t('progress.lit', { a: lit.lit, b: cells })} · ${lit.percent}%`);
    out.push(diff > 0 ? t('progress.gap', { v: formatMoney(diff, locale) })
      : diff === 0 ? t('progress.exact') : t('progress.enough', { v: formatMoney(-diff, locale) }));
    const a = monthlyAffordable(opts.assets, inputs);
    out.push(a.ok ? t('progress.afford', { v: `¥${Math.round(a.monthly).toLocaleString('en-US')}` })
      : a.reason === 'reserves-equal-assets' ? t('progress.equal')
        : a.reason === 'reserves-exceed-assets' ? t('progress.exceed') : t('result.nonPositive'));
  }
  return out.join('\n') + '\n';
}
