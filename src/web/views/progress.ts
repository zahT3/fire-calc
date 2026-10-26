import { computeTarget, monthlyAffordable } from '../../core/calc';
import { allocateCells, pickUnit, progressCells } from '../../core/cells';
import { formatMoney } from '../../core/format';
import { CN } from '../../regions/cn';
import { esc, type Ctx } from '../ctx';
import { deriveInputs, errorFor, field, type AppState } from '../store';
import { assumeHTML, bindAssume } from './assume';
import { paintAssume } from './result';

const yuan = (n: number) => `¥${Math.round(n).toLocaleString('en-US')}`;

// 点亮格数由 main 画到方格上，这里只算一次，保证文字和方格一致
export function progressFor(s: AppState): { lit: number; cells: number; percent: number; reached: boolean } | null {
  const assets = field(s, 'assets');
  const r = computeTarget(deriveInputs(s));
  if (!assets.ok || !r.ok || r.total <= 0) return null;
  const { cells } = allocateCells(r.parts, pickUnit(r.total));
  return { cells, ...progressCells(assets.value, r.total, cells) };
}

function paint(root: HTMLElement, ctx: Ctx) {
  const s = ctx.store.get();
  const inputs = deriveInputs(s);
  const r = computeTarget(inputs);
  const assets = field(s, 'assets');
  const line = root.querySelector<HTMLElement>('#progressLine')!;
  const bar = root.querySelector<HTMLElement>('#bar')!;
  const gap = root.querySelector<HTMLElement>('#gap')!;
  const afford = root.querySelector<HTMLElement>('#afford')!;
  paintAssume(root, ctx);
  root.querySelectorAll<HTMLButtonElement>('.chip[data-field]').forEach((b) =>
    b.setAttribute('aria-pressed', String(assets.ok && assets.value === Number(b.dataset.value))));

  const p = progressFor(s);
  line.hidden = bar.hidden = gap.hidden = !p;
  if (!r.ok) { afford.textContent = ctx.t('result.nonPositive'); return; }
  if (!assets.ok || !p) { afford.textContent = ''; return; }

  line.textContent = `${ctx.t('progress.lit', { a: p.lit, b: p.cells })} · ${p.percent}%`;
  (bar.firstElementChild as HTMLElement).style.width = `${p.percent}%`;
  const diff = r.total - assets.value;
  gap.textContent = diff > 0 ? ctx.t('progress.gap', { v: formatMoney(diff, s.lang) })
    : diff === 0 ? ctx.t('progress.exact') : ctx.t('progress.enough', { v: formatMoney(-diff, s.lang) });

  const a = monthlyAffordable(assets.value, inputs);
  afford.textContent = a.ok ? ctx.t('progress.afford', { v: yuan(a.monthly) })
    : a.reason === 'reserves-equal-assets' ? ctx.t('progress.equal')
      : a.reason === 'reserves-exceed-assets' ? ctx.t('progress.exceed') : ctx.t('result.nonPositive');
}

export function renderProgress(root: HTMLElement, ctx: Ctx) {
  const s = ctx.store.get();
  const { t } = ctx;
  const err = errorFor(s, 'assets');
  const p = field(s, 'assets');
  root.innerHTML = `
    <section class="progress">
      <h2 tabindex="-1">${esc(t('progress.title'))}</h2>
      <p class="hint">${esc(t('progress.hint'))}</p>
      <label class="field">
        <span class="sr-only">${esc(t('progress.title'))}</span>
        <input class="mono" name="assets" inputmode="decimal" autocomplete="off" value="${esc(s.text.assets ?? '')}"
          aria-invalid="${!!err}" aria-describedby="err-assets">
        <span class="unit">${esc(t('q.house.unit'))}</span>
      </label>
      <p class="err" id="err-assets" role="alert" ${err ? '' : 'hidden'}>${err ? esc(t(`err.${err}`)) : ''}</p>
      <div class="chips" role="group">${CN.refs.assets.map((r) => `
        <button class="chip" data-field="assets" data-value="${r.value}" aria-pressed="${p.ok && p.value === r.value}">${esc(r.label[s.lang])}</button>`).join('')}</div>
      <p class="progress__line mono" id="progressLine"></p>
      <div class="bar" id="bar"><i></i></div>
      <p class="progress__gap" id="gap"></p>
      <p class="progress__afford" id="afford" role="status"></p>
      ${assumeHTML(s, ctx)}
      <div class="spacer"></div>
      <button class="btn btn--ghost" id="back">← ${esc(t('progress.back'))}</button>
    </section>`;

  const inp = root.querySelector<HTMLInputElement>('input[name=assets]')!;
  const errEl = root.querySelector<HTMLElement>('#err-assets')!;
  const onInput = () => {
    ctx.store.set({ text: { ...ctx.store.get().text, assets: inp.value } });
    const e = errorFor(ctx.store.get(), 'assets');
    errEl.hidden = !e;
    errEl.textContent = e ? t(`err.${e}`) : '';
    inp.setAttribute('aria-invalid', String(!!e));
    paint(root, ctx);
  };
  inp.addEventListener('input', onInput);
  root.querySelectorAll<HTMLButtonElement>('.chip[data-field]').forEach((b) => b.addEventListener('click', () => {
    inp.value = String(Number(b.dataset.value) / 1e4);
    onInput();
  }));
  bindAssume(root, ctx, () => paint(root, ctx));
  root.querySelector('#back')!.addEventListener('click', () => ctx.go({ view: 'result' }));
  paint(root, ctx);
  root.querySelector<HTMLElement>('h2')!.focus({ preventScroll: true });
}
