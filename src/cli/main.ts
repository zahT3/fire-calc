#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { env, exit, stderr, stdin, stdout } from 'node:process';
import { parseArgs } from 'node:util';
import { computeTarget, monthlyAffordable } from '../core/calc';
import { allocateCells, pickUnit } from '../core/cells';
import { parseField, type FieldKey } from '../core/parse';
import { DEFAULT_INFLATION, DEFAULT_RETURN, type Housing, type Inputs, type Locale } from '../core/types';
import { t as translate, type MessageKey } from '../i18n';
import { CN } from '../regions/cn';
import type { RefField } from '../regions/types';
import { renderTerminal } from './render';

const OPTS: [opt: string, field: FieldKey][] = [
  ['x', 'monthlySpend'], ['kids', 'kids'], ['k', 'perKid'], ['m', 'medical'], ['h', 'house'],
  ['assets', 'assets'], ['return', 'nominalReturn'], ['inflation', 'inflation'],
];
const HOUSING: readonly Housing[] = ['own', 'rent', 'buy'];

const USAGE = `fire-calc — 你需要多少钱，才能财富自由？ / How much do you need to be financially free?

  --x <元/月>          理想月开销 / monthly spending (CNY)
  --kids <n>           孩子数 / number of kids
  --k <万>             每个孩子到 18 岁还要留多少 / per kid until 18 (×10K CNY)
  --m <万>             一辈子医疗费 / lifetime healthcare (×10K CNY)
  --housing own|rent|buy
  --h <万>             买房预算 / home budget (×10K CNY)
  --assets <万>        能拿来投资的钱 / investable assets (×10K CNY)
  --return <%>         投资回报，默认 4.5 / nominal return, default 4.5
  --inflation <%>      通胀，默认 2 / inflation, default 2
  --lang zh|en   --json   --help

不带参数时逐题提问 / Asks interactively when arguments are missing.
`;

function fail(lines: string[]): never {
  stderr.write(lines.join('\n') + '\n');
  exit(2);
}

let values: Record<string, string | boolean | undefined>;
try {
  ({ values } = parseArgs({
    options: {
      ...Object.fromEntries(OPTS.map(([o]) => [o, { type: 'string' as const }])),
      housing: { type: 'string' }, lang: { type: 'string' }, json: { type: 'boolean' }, help: { type: 'boolean' },
    },
    strict: true,
  }));
} catch (e) {
  fail([(e as Error).message, '', USAGE]);
}

const locale: Locale = values.lang === 'zh' || values.lang === 'en' ? values.lang
  : (env.LC_ALL || env.LC_MESSAGES || env.LANG || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
const t = (k: MessageKey, v?: Record<string, string | number>) => translate(locale, k, v);

if (values.help) {
  stdout.write(USAGE);
  exit(0);
}

const parsed: Partial<Record<FieldKey, number>> = {};
const errors: string[] = [];
for (const [opt, field] of OPTS) {
  const raw = values[opt];
  if (typeof raw !== 'string') continue;
  const p = parseField(field, raw);
  if (p.ok) parsed[field] = p.value;
  else errors.push(`--${opt} ${raw}: ${t(`err.${p.error}`)} (${field})`);
}
let housing = values.housing as Housing | undefined;
if (housing !== undefined && !HOUSING.includes(housing)) errors.push(`--housing ${housing}: own | rent | buy`);
if (errors.length) fail(errors);

const missing = () => {
  const m: string[] = [];
  if (parsed.monthlySpend === undefined) m.push('--x');
  if (parsed.kids === undefined) m.push('--kids');
  else if (parsed.kids > 0 && parsed.perKid === undefined) m.push('--k');
  if (parsed.medical === undefined) m.push('--m');
  if (!housing) m.push('--housing');
  else if (housing === 'buy' && parsed.house === undefined) m.push('--h');
  return m;
};

async function ask(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });
  const refs = (f: RefField) => CN.refs[f].map((r) => r.label[locale]).join(' / ');
  const askField = async (field: FieldKey, question: string, hint?: string) => {
    for (;;) {
      const a = await rl.question(`${question}${hint ? `\n  (${hint})` : ''}\n> `);
      const p = parseField(field, a);
      if (p.ok) { parsed[field] = p.value; return; }
      stdout.write(`  ${t(`err.${p.error}`)}\n`);
    }
  };
  if (parsed.monthlySpend === undefined) await askField('monthlySpend', `${t('q.living.title')} [${t('q.living.unit')}]`, refs('monthlySpend'));
  if (parsed.kids === undefined) await askField('kids', t('q.kids.title'));
  if (parsed.kids! > 0 && parsed.perKid === undefined) await askField('perKid', `${t('q.kids.perTitle')} [${t('q.kids.unit')}]`, refs('perKid'));
  if (parsed.medical === undefined) await askField('medical', `${t('q.medical.title')} [${t('q.medical.unit')}]`, refs('medical'));
  while (!housing) {
    const a = (await rl.question(`${t('q.house.title')}\n  1) ${t('q.house.own')}  2) ${t('q.house.rent')}  3) ${t('q.house.buy')}\n> `)).trim();
    housing = ({ '1': 'own', '2': 'rent', '3': 'buy' } as const)[a as '1' | '2' | '3'];
  }
  if (housing === 'buy' && parsed.house === undefined) await askField('house', `${t('q.house.buy')} [${t('q.house.unit')}]`, refs('house'));
  rl.close();
}

if (missing().length) {
  if (stdin.isTTY && !values.json) {
    try {
      await ask();
    } catch (e) {
      // 用户按 Ctrl+D / Ctrl+C 中途退出：换行后安静结束，不打印堆栈
      if ((e as Error).name !== 'AbortError') throw e;
      stdout.write('\n');
      exit(130);
    }
  }
  else fail([`missing: ${missing().join(' ')}`, '', USAGE]);
}

const inputs: Inputs = {
  monthlySpend: parsed.monthlySpend!, kids: parsed.kids!, perKid: parsed.perKid ?? 0, medical: parsed.medical!,
  housing: housing!, house: parsed.house ?? 0,
  nominalReturn: parsed.nominalReturn ?? DEFAULT_RETURN, inflation: parsed.inflation ?? DEFAULT_INFLATION,
};

if (values.json) {
  const r = computeTarget(inputs);
  if (!r.ok) {
    stdout.write(JSON.stringify({ inputs, error: r.reason }, null, 2) + '\n');
  } else {
    const unit = pickUnit(r.total);
    const { cells } = allocateCells(r.parts, unit);
    const affordable = parsed.assets === undefined ? undefined : monthlyAffordable(parsed.assets, inputs);
    stdout.write(JSON.stringify({ inputs, realReturn: r.realReturn, multiplier: r.multiplier, parts: r.parts, total: r.total, unit, cells, affordable }, null, 2) + '\n');
  }
} else {
  const color = stdout.isTTY && !env.NO_COLOR;
  stdout.write(renderTerminal(inputs, locale, { color, assets: parsed.assets }));
}
