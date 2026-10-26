import { parseField, type FieldKey } from './parse';
import type { Housing, Inputs, Locale } from './types';

export interface LinkState {
  inputs: Partial<Inputs>;
  assets?: number;
  lang?: Locale;
  demo?: boolean;
}

const VERSION = '1';
// 链接里的数按界面单位写（元 / 万元 / 百分数），便于人读
const NUMERIC: [param: string, field: Exclude<FieldKey, 'assets'>][] = [
  ['x', 'monthlySpend'], ['n', 'kids'], ['k', 'perKid'], ['m', 'medical'], ['h', 'house'],
  ['r', 'nominalReturn'], ['i', 'inflation'],
];
const HOUSING: readonly Housing[] = ['own', 'rent', 'buy'];
const LOCALES: readonly Locale[] = ['zh', 'en'];

const clean = (n: number) => String(Number(n.toFixed(6)));

function toUi(field: FieldKey, value: number): string {
  if (field === 'monthlySpend' || field === 'kids') return clean(value);
  if (field === 'nominalReturn' || field === 'inflation') return clean(value * 100);
  return clean(value / 1e4);
}

export function encodeLink(s: LinkState): string {
  const q = new URLSearchParams({ v: VERSION });
  for (const [param, field] of NUMERIC) {
    const v = s.inputs[field];
    if (typeof v === 'number') q.set(param, toUi(field, v));
  }
  if (s.inputs.housing) q.set('hs', s.inputs.housing);
  if (typeof s.assets === 'number') q.set('a', toUi('assets', s.assets));
  if (s.lang) q.set('lang', s.lang);
  if (s.demo) q.set('demo', '1');
  return q.toString();
}

export function decodeLink(search: string): LinkState {
  const q = new URLSearchParams(search.replace(/^\?/, ''));
  if (q.get('v') !== VERSION) return {};

  const s: LinkState = { inputs: {} };
  for (const [param, field] of NUMERIC) {
    const raw = q.get(param);
    if (raw === null) continue;
    const p = parseField(field, raw);
    if (p.ok) s.inputs[field] = p.value;
  }
  const hs = q.get('hs');
  if (HOUSING.includes(hs as Housing)) s.inputs.housing = hs as Housing;
  const a = q.get('a');
  if (a !== null) {
    const p = parseField('assets', a);
    if (p.ok) s.assets = p.value;
  }
  const lang = q.get('lang');
  if (LOCALES.includes(lang as Locale)) s.lang = lang as Locale;
  if (q.get('demo') === '1') s.demo = true;
  return s;
}
