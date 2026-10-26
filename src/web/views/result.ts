import { computeTarget } from '../../core/calc';
import { formatBreakdown, formatMoney } from '../../core/format';
import type { FieldKey } from '../../core/parse';
import { PART_KEYS, type PartKey } from '../../core/types';
import type { MessageKey } from '../../i18n';
import { esc, type Ctx } from '../ctx';
import { deriveInputs, errorFor, initialState, STEPS, type AppState } from '../store';

const TAB_KEY: Record<PartKey, MessageKey> = { living: 'tab.living', kids: 'tab.kids', medical: 'tab.medical', house: 'tab.house' };
const CHEVRON = '<svg width="8" height="12" viewBox="0 0 8 12" aria-hidden="true"><path d="M1.5 1.5 6 6l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const pct = (x: number) => String(Number((x * 100).toFixed(2)));

function rowLabel(s: AppState, part: PartKey, ctx: Ctx): string {
  const i = deriveInputs(s);
  const money = (v: number) => formatMoney(v, s.lang);
  if (part === 'living') return ctx.t('result.living', { v: money(i.monthlySpend) });
  if (part === 'kids') return i.kids ? ctx.t('result.kids', { n: i.kids, v: money(i.perKid) }) : ctx.t('result.kidsNone');
  if (part === 'medical') return ctx.t('result.medical');
  return ctx.t(i.housing === 'buy' ? 'result.house' : i.housing === 'own' ? 'result.houseOwn' : 'result.houseRent');
}

function paint(root: HTMLElement, ctx: Ctx) {
  const s = ctx.store.get();
  const inputs = deriveInputs(s);
  const r = computeTarget(inputs);
  const rows = root.querySelector<HTMLElement>('#rows')!;
  root.querySelector<HTMLElement>('#nonPositive')!.hidden = r.ok;
  root.querySelector<HTMLElement>('#toProgress')!.hidden = !r.ok;
  if (!r.ok) {
    rows.innerHTML = '';
    root.querySelector('#assumeBody')!.textContent = '';
    root.querySelector('#alt')!.textContent = '';
    return;
  }
  const f = formatBreakdown(r.parts, r.total, s.lang);
  const sym: Record<PartKey, string> = { living: `${Math.round(r.multiplier)}X`, kids: 'K × n', medical: 'M', house: 'H' };
  rows.innerHTML = PART_KEYS.map((p, i) => `
    <button class="row" data-goto="${STEPS.indexOf(p)}" aria-label="${esc(ctx.t('result.edit', { name: ctx.t(TAB_KEY[p]), v: f.parts[p] }))}">
      <span class="op mono">${i ? '+' : ''}</span>
      <i class="dot" style="background:var(--${p})"></i>
      <span class="label">${esc(rowLabel(s, p, ctx))}<span class="sym mono">${sym[p]}</span></span>
      <b class="mono">${esc(f.parts[p])}</b>${CHEVRON}
    </button>`).join('') + `
    <div class="rsum"><span class="op mono">=</span><span>${esc(ctx.t('result.sum'))}</span>
      <b class="mono">${f.approx ? esc(ctx.t('result.approx')) + ' ' : ''}${esc(f.total)}</b></div>`;
  rows.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((b) =>
    b.addEventListener('click', () => ctx.go({ view: 'q', step: Number(b.dataset.goto) })));

  root.querySelector('#assumeBody')!.textContent = ctx.t('result.assumeBody', { r: pct(r.realReturn), m: Math.round(r.multiplier) });
  const atTwo = r.total - r.parts.living + 600 * inputs.monthlySpend;
  root.querySelector('#alt')!.textContent = Math.abs(r.realReturn - 0.02) > 1e-9 ? ctx.t('result.alt', { v: formatMoney(atTwo, s.lang) }) : '';
}

function assumeInput(s: AppState, ctx: Ctx, key: FieldKey, label: MessageKey): string {
  const err = errorFor(s, key);
  return `<label class="assume__field">${esc(ctx.t(label))}
    <input class="mono" name="${key}" inputmode="decimal" value="${esc(s.text[key] ?? '')}" aria-invalid="${!!err}"> %</label>`;
}

export function renderResult(root: HTMLElement, ctx: Ctx) {
  const s = ctx.store.get();
  const { t } = ctx;
  root.innerHTML = `
    <section class="result">
      <h2 class="sr-only" tabindex="-1">${esc(t('top.result'))}</h2>
      ${s.demo ? `<p class="tag">${esc(t('result.demo'))}</p>` : ''}
      <div id="rows"></div>
      <p class="nonpos" id="nonPositive" role="status" hidden>${esc(t('result.nonPositive'))}</p>
      <p class="basis">${esc(t('result.basis'))}</p>
      <details class="assume">
        <summary>${esc(t('result.assume'))} ⓘ</summary>
        <p id="assumeBody"></p><p id="alt"></p>
        <div class="assume__inputs">${assumeInput(s, ctx, 'nominalReturn', 'result.return')} −
          ${assumeInput(s, ctx, 'inflation', 'result.inflation')}</div>
      </details>
      <div class="spacer"></div>
      <button class="btn btn--light" id="toProgress">${esc(t('result.toProgress'))}</button>
      <div class="actions">
        <button class="btn btn--ghost" id="share">${esc(t('result.share'))}</button>
        <button class="btn btn--ghost" id="copy">${esc(t('result.copy'))}</button>
        <button class="btn btn--ghost" id="restart">↺ ${esc(t('result.restart'))}</button>
      </div>
    </section>`;
  paint(root, ctx);

  root.querySelectorAll<HTMLInputElement>('.assume input').forEach((inp) => inp.addEventListener('input', () => {
    ctx.store.set({ text: { ...ctx.store.get().text, [inp.name]: inp.value } });
    inp.setAttribute('aria-invalid', String(!!errorFor(ctx.store.get(), inp.name as FieldKey)));
    paint(root, ctx);
  }));
  root.querySelector('#toProgress')!.addEventListener('click', () => ctx.go({ view: 'progress' }));
  root.querySelector('#restart')!.addEventListener('click', () => {
    const cur = ctx.store.get();
    // 从视频示例进来的清空，避免示例的数混进自己的计算；自己算的保留，方便微调重算
    const fresh = initialState(cur.lang);
    const keep = cur.demo ? { text: { ...fresh.text, nominalReturn: cur.text.nominalReturn, inflation: cur.text.inflation }, housing: null, kidsMore: false } : {};
    ctx.go({ ...keep, answered: new Set(), step: 0, view: 'q', resultSeen: false, demo: false });
  });
  root.querySelector<HTMLElement>('h2')!.focus({ preventScroll: true });
}
