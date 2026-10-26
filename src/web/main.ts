import './style.css';
import { computeTarget } from '../core/calc';
import { formatMoney } from '../core/format';
import { decodeLink, toUiText } from '../core/link';
import type { FieldKey } from '../core/parse';
import type { Locale } from '../core/types';
import { renderBoard, flyInto, indexesOf } from './board';
import { makeT, type Ctx } from './ctx';
import { countTo, prefersReducedMotion } from './motion';
import { createStore, deriveInputs, firstUnanswered, initialState, STEPS, stepValid, type AppState } from './store';
import { renderIntro } from './views/intro';
import { renderQuestion } from './views/question';
import { progressFor, renderProgress } from './views/progress';
import { renderResult } from './views/result';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const link = decodeLink(location.search);
const lang: Locale = link.lang ?? (navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en');
const store = createStore(initialState(lang));
applyLink();

function applyLink() {
  if (!link.inputs || Object.keys(link.inputs).length === 0) return;
  const s = store.get();
  const text = { ...s.text };
  for (const [key, value] of Object.entries(link.inputs)) {
    if (typeof value === 'number') text[key as FieldKey] = toUiText(key as FieldKey, value);
  }
  if (typeof link.assets === 'number') text.assets = toUiText('assets', link.assets);
  store.set({ text, housing: link.inputs.housing ?? null, demo: !!link.demo });
  // 从第一题起连续有效的题都算答过；全部有效就直接进结果页
  const answered = new Set<(typeof STEPS)[number]>();
  for (const p of STEPS) {
    if (!stepValid(store.get(), p)) break;
    answered.add(p);
  }
  const next = answered.size === STEPS.length ? -1 : answered.size;
  store.set({ answered, view: next < 0 ? 'result' : 'q', step: next < 0 ? 0 : next, resultSeen: next < 0 });
}

// 只有"确认后自动切到的那一屏"需要防双击；用户自己点叠卡条、按返回打开的屏不受影响
let guardUntil = 0;
const stage = $('#stage');
// 双击的第二下之前不会有别的操作；用户在新一屏上输入或点了别处，就不再是双击
stage.addEventListener('input', () => { guardUntil = 0; });
stage.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('#next')) guardUntil = 0;
}, true);
const ctx: Ctx = { store, t: makeT(store), go, confirm };

function go(patch: Partial<AppState>) {
  guardUntil = 0;
  store.set(patch);
  const s = store.get();
  history.pushState({ view: s.view, step: s.step }, '');
  render();
}

// 一次确认只触发一次跳转；动画进行中的重复点击直接忽略
let busy = false;
let motion: AbortController | null = null;
let counting = false;

function confirm(from: DOMRect | null) {
  if (busy || performance.now() < guardUntil) return;
  const s = store.get();
  const part = STEPS[s.step]!;
  if (!stepValid(s, part)) return;
  const isNew = !s.answered.has(part);
  const before = computeTarget(deriveInputs(s), [...s.answered]);
  store.set({ answered: new Set(s.answered).add(part) });
  const next = firstUnanswered(store.get());
  // 双击的第二下会落在新一屏的"下一步"上，切过去后短暂忽略确认
  busy = true;
  const advance = () => {
    if (next < 0) go({ view: 'result', resultSeen: true });
    else go({ view: 'q', step: next });
    busy = false;
    guardUntil = performance.now() + 350;
  };

  const after = computeTarget(deriveInputs(store.get()), [...store.get().answered]);
  if (!isNew || !from || prefersReducedMotion() || !after.ok) { advance(); return; }
  const info = renderBoard($('#grid'), after.parts);
  const targets = indexesOf(info.counts, part);
  if (targets.length === 0) { advance(); return; }

  ($('#next') as HTMLButtonElement).disabled = true;
  motion?.abort();
  motion = new AbortController();
  const signal = motion.signal;
  const color = getComputedStyle(document.documentElement).getPropertyValue(`--${part}`);
  void flyInto(from, $('#grid'), targets, color, signal);
  counting = true;
  countTo($('#total'), before.ok ? before.total : 0, after.total, (n) => formatMoney(n, store.get().lang), signal);
  setTimeout(() => { counting = false; }, 700);
  $('#card').animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.9)', opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' });
  setTimeout(advance, 240);
}

addEventListener('popstate', (e) => {
  const st = e.state as Pick<AppState, 'view' | 'step'> | null;
  if (!st) return;
  store.set({ view: st.view, step: st.step });
  render();
});

let lastUnit: number | null = null;

function chrome() {
  const s = store.get();
  const r = computeTarget(deriveInputs(s), [...s.answered]);
  $('#brand').textContent = ctx.t('app.title');
  $('#totalLabel').textContent = ctx.t(s.view === 'q' ? 'top.running' : 'top.result');
  if (!counting) $('#total').textContent = r.ok ? formatMoney(r.total, s.lang) : '—';
  $('#lang').textContent = ctx.t('lang.switch');
  if (s.view === 'intro') return;
  if (!r.ok) {
    $('#grid').innerHTML = '';
    $('#unit').textContent = '';
    $('#cellCount').textContent = '';
    return;
  }
  const lit = s.view === 'progress' ? progressFor(s)?.lit ?? null : null;
  const info = renderBoard($('#grid'), r.parts, { lit });
  const unitEl = $('#unit');
  unitEl.textContent = ctx.t('board.unit', { v: formatMoney(info.unit, s.lang) });
  $('#cellCount').textContent = info.cells ? ctx.t('board.cells', { n: info.cells }) : '';
  if (lastUnit !== null && info.unit !== lastUnit && !prefersReducedMotion()) {
    unitEl.classList.add('flash');
    setTimeout(() => unitEl.classList.remove('flash'), 900);
  }
  lastUnit = info.unit;
}

function render() {
  const s = store.get();
  document.documentElement.lang = s.lang === 'zh' ? 'zh-CN' : 'en';
  document.title = ctx.t('app.title');
  document.body.dataset.view = s.view;
  chrome();
  if (s.view === 'intro') renderIntro(stage, ctx);
  else if (s.view === 'q') renderQuestion(stage, ctx);
  else if (s.view === 'result') renderResult(stage, ctx);
  else renderProgress(stage, ctx);
}

$('#lang').addEventListener('click', () => {
  store.set({ lang: store.get().lang === 'zh' ? 'en' : 'zh' });
  render();
});
store.subscribe(chrome);
history.replaceState({ view: store.get().view, step: store.get().step }, '');
render();
