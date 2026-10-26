import { formatMoney } from '../../core/format';
import type { FieldKey } from '../../core/parse';
import type { Housing, PartKey } from '../../core/types';
import type { MessageKey } from '../../i18n';
import { CN } from '../../regions/cn';
import type { RefField } from '../../regions/types';
import { esc, type Ctx } from '../ctx';
import { deriveInputs, errorFor, field, kidsCount, STEPS, stepValid, type AppState } from '../store';

const KID_CHOICES = ['0', '1', '2', '3'];
const HOUSING: Housing[] = ['own', 'rent', 'buy'];
const TAB_KEY: Record<PartKey, MessageKey> = { living: 'tab.living', kids: 'tab.kids', medical: 'tab.medical', house: 'tab.house' };

function tabValue(s: AppState, part: PartKey, ctx: Ctx): string {
  const i = deriveInputs(s);
  const money = (v: number) => formatMoney(v, s.lang);
  if (part === 'living') return ctx.t('unit.perMonth', { v: money(i.monthlySpend) });
  if (part === 'kids') return i.kids ? `${i.kids} × ${money(i.perKid)}` : ctx.t('tab.none');
  if (part === 'medical') return money(i.medical);
  if (i.housing === 'buy') return money(i.house);
  return ctx.t(i.housing === 'own' ? 'tab.own' : 'tab.rent');
}

function tabsHTML(s: AppState, ctx: Ctx): string {
  const done = STEPS.filter((p, i) => i !== s.step && s.answered.has(p));
  return `<div class="tabs">${done.map((p, i) => `
    <button class="tab card--${p}" data-goto="${STEPS.indexOf(p)}" style="margin-inline:${(done.length - i) * 8}px">
      <span>${esc(ctx.t(TAB_KEY[p]))}</span><span class="mono">${esc(tabValue(s, p, ctx))}</span>
    </button>`).join('')}</div>`;
}

function inputHTML(s: AppState, ctx: Ctx, key: FieldKey, label: string, unit: string): string {
  const err = errorFor(s, key);
  return `
    <label class="field">
      <span class="sr-only">${esc(label)}</span>
      <input class="mono" name="${key}" inputmode="decimal" autocomplete="off" enterkeyhint="next"
        value="${esc(s.text[key] ?? '')}" aria-invalid="${err ? 'true' : 'false'}" aria-describedby="err-${key}">
      <span class="unit">${esc(unit)}</span>
    </label>
    <p class="err" id="err-${key}" role="alert" ${err ? '' : 'hidden'}>${err ? esc(errText(ctx, err)) : ''}</p>`;
}

const errText = (ctx: Ctx, e: string) => ctx.t(`err.${e}` as MessageKey);

function refChips(s: AppState, key: RefField): string {
  const p = field(s, key);
  return `<div class="chips" role="group">${CN.refs[key].map((r) => `
    <button class="chip" data-field="${key}" data-value="${r.value}" aria-pressed="${p.ok && p.value === r.value}">${esc(r.label[s.lang])}</button>`).join('')}</div>`;
}

function infoHTML(s: AppState, body: string, key: RefField): string {
  const notes = CN.refs[key].filter((r) => r.note).map((r) => `<li>${esc(r.label[s.lang])}：${esc(r.note![s.lang])}</li>`).join('');
  return `<details class="info"><summary>ⓘ</summary><p>${esc(body)}</p>${notes ? `<ul>${notes}</ul>` : ''}</details>`;
}

function bodyHTML(s: AppState, part: PartKey, ctx: Ctx): string {
  const { t } = ctx;
  if (part === 'living') {
    return `<h2 tabindex="-1">${esc(t('q.living.title'))}</h2><p class="hint">${esc(t('q.living.hint'))}</p>
      ${inputHTML(s, ctx, 'monthlySpend', t('q.living.title'), t('q.living.unit'))}
      ${refChips(s, 'monthlySpend')}${infoHTML(s, t('q.living.info'), 'monthlySpend')}`;
  }
  if (part === 'kids') {
    const n = kidsCount(s);
    const more = s.kidsMore || (n !== null && n >= 4);
    const showPer = more || (n !== null && n > 0);
    return `<h2 tabindex="-1">${esc(t('q.kids.title'))}</h2>
      <div class="chips" role="group">
        ${KID_CHOICES.map((c) => `<button class="chip chip--round" data-kids="${c}" aria-pressed="${!more && s.text.kids === c}">${c}</button>`).join('')}
        <button class="chip chip--round" data-kids="more" aria-pressed="${more}">4+</button>
      </div>
      ${more ? inputHTML(s, ctx, 'kids', t('q.kids.count'), t('q.kids.count')) : ''}
      <div ${showPer ? '' : 'hidden'}>
        <h3 class="sub">${esc(t('q.kids.perTitle'))}</h3>
        ${inputHTML(s, ctx, 'perKid', t('q.kids.perTitle'), t('q.kids.unit'))}
        ${refChips(s, 'perKid')}${infoHTML(s, t('q.kids.info'), 'perKid')}
      </div>`;
  }
  if (part === 'medical') {
    return `<h2 tabindex="-1">${esc(t('q.medical.title'))}</h2><p class="hint">${esc(t('q.medical.hint'))}</p>
      ${inputHTML(s, ctx, 'medical', t('q.medical.title'), t('q.medical.unit'))}
      ${refChips(s, 'medical')}${infoHTML(s, t('q.medical.info'), 'medical')}`;
  }
  return `<h2 tabindex="-1">${esc(t('q.house.title'))}</h2>
    <div class="opts" role="group">
      ${HOUSING.map((h) => `<button class="opt" data-housing="${h}" aria-pressed="${s.housing === h}">${esc(t(`q.house.${h}` as MessageKey))}${h === 'rent' ? `<span class="hint">${esc(t('q.house.rentHint'))}</span>` : ''}</button>`).join('')}
    </div>
    <div ${s.housing === 'buy' ? '' : 'hidden'}>
      ${inputHTML(s, ctx, 'house', t('q.house.buy'), t('q.house.unit'))}${refChips(s, 'house')}
    </div>`;
}

function nextLabel(s: AppState, ctx: Ctx): string {
  const rest = STEPS.filter((p, i) => i !== s.step && !s.answered.has(p)).length;
  return ctx.t(rest ? 'nav.next' : s.resultSeen ? 'nav.done' : 'nav.seeResult');
}

export function renderQuestion(root: HTMLElement, ctx: Ctx, focus: 'title' | string = 'title') {
  const s = ctx.store.get();
  const part = STEPS[s.step]!;
  root.innerHTML = `${tabsHTML(s, ctx)}
    <section class="card card--${part}" id="card">
      <div class="meta">${esc(ctx.t('nav.step', { n: s.step + 1 }))}</div>
      ${bodyHTML(s, part, ctx)}
      <div class="spacer"></div>
      <button class="btn btn--dark" id="next" ${stepValid(s, part) ? '' : 'disabled'}>${esc(nextLabel(s, ctx))}</button>
    </section>`;

  const rerender = (focusSel: string) => renderQuestion(root, ctx, focusSel);
  const refresh = () => {
    const cur = ctx.store.get();
    (root.querySelector('#next') as HTMLButtonElement).disabled = !stepValid(cur, part);
    root.querySelectorAll<HTMLButtonElement>('.chip[data-field]').forEach((b) => {
      const p = field(cur, b.dataset.field as FieldKey);
      b.setAttribute('aria-pressed', String(p.ok && p.value === Number(b.dataset.value)));
    });
  };
  const setText = (key: FieldKey, value: string) => ctx.store.set({ text: { ...ctx.store.get().text, [key]: value } });

  root.querySelectorAll<HTMLInputElement>('input[name]').forEach((inp) => {
    inp.addEventListener('input', () => {
      const key = inp.name as FieldKey;
      setText(key, inp.value);
      const err = errorFor(ctx.store.get(), key);
      const el = root.querySelector<HTMLElement>(`#err-${key}`)!;
      el.hidden = !err;
      el.textContent = err ? errText(ctx, err) : '';
      inp.setAttribute('aria-invalid', String(!!err));
      if (key === 'kids') return rerender(`input[name=kids]`);
      refresh();
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !(root.querySelector('#next') as HTMLButtonElement).disabled) ctx.confirm(cardRect());
    });
  });
  root.querySelectorAll<HTMLButtonElement>('.chip[data-field]').forEach((b) => b.addEventListener('click', () => {
    const key = b.dataset.field as FieldKey;
    const v = Number(b.dataset.value);
    setText(key, key === 'monthlySpend' ? String(v) : String(v / 1e4));
    const inp = root.querySelector<HTMLInputElement>(`input[name=${key}]`)!;
    inp.value = ctx.store.get().text[key]!;
    inp.dispatchEvent(new Event('input'));
  }));
  root.querySelectorAll<HTMLButtonElement>('[data-kids]').forEach((b) => b.addEventListener('click', () => {
    const v = b.dataset.kids!;
    if (v === 'more') ctx.store.set({ kidsMore: true, text: { ...ctx.store.get().text, kids: '' } });
    else ctx.store.set({ kidsMore: false, text: { ...ctx.store.get().text, kids: v } });
    rerender(`[data-kids="${v}"]`);
  }));
  root.querySelectorAll<HTMLButtonElement>('[data-housing]').forEach((b) => b.addEventListener('click', () => {
    ctx.store.set({ housing: b.dataset.housing as Housing });
    rerender(`[data-housing="${b.dataset.housing}"]`);
  }));
  root.querySelectorAll<HTMLButtonElement>('[data-goto]').forEach((b) => b.addEventListener('click', () => {
    ctx.go({ view: 'q', step: Number(b.dataset.goto) });
  }));
  const cardRect = () => root.querySelector('#card')!.getBoundingClientRect();
  root.querySelector('#next')!.addEventListener('click', () => ctx.confirm(cardRect()));

  const target = focus === 'title' ? root.querySelector<HTMLElement>('h2') : root.querySelector<HTMLElement>(focus);
  target?.focus({ preventScroll: focus === 'title' });
  if (target instanceof HTMLInputElement) target.setSelectionRange(target.value.length, target.value.length);
}
