import './style.css';
import { computeTarget } from '../core/calc';
import { formatMoney } from '../core/format';
import { decodeLink, toUiText } from '../core/link';
import type { FieldKey } from '../core/parse';
import type { Locale } from '../core/types';
import { esc, makeT, type Ctx } from './ctx';
import { createStore, deriveInputs, firstUnanswered, initialState, STEPS, stepValid, type AppState } from './store';
import { renderIntro } from './views/intro';
import { renderQuestion } from './views/question';

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

const stage = $('#stage');
const ctx: Ctx = { store, t: makeT(store), go, confirm };

function go(patch: Partial<AppState>) {
  store.set(patch);
  const s = store.get();
  history.pushState({ view: s.view, step: s.step }, '');
  render();
}

function confirm() {
  const s = store.get();
  const part = STEPS[s.step]!;
  if (!stepValid(s, part)) return;
  store.set({ answered: new Set(s.answered).add(part) });
  const next = firstUnanswered(store.get());
  if (next < 0) go({ view: 'result', resultSeen: true });
  else go({ view: 'q', step: next });
}

addEventListener('popstate', (e) => {
  const st = e.state as Pick<AppState, 'view' | 'step'> | null;
  if (!st) return;
  store.set({ view: st.view, step: st.step });
  render();
});

function header() {
  const s = store.get();
  const r = computeTarget(deriveInputs(s), [...s.answered]);
  $('#brand').textContent = ctx.t('app.title');
  $('#totalLabel').textContent = ctx.t(s.view === 'q' ? 'top.running' : 'top.result');
  $('#total').textContent = r.ok ? formatMoney(r.total, s.lang) : '—';
  $('#lang').textContent = ctx.t('lang.switch');
}

function render() {
  const s = store.get();
  document.documentElement.lang = s.lang === 'zh' ? 'zh-CN' : 'en';
  document.title = ctx.t('app.title');
  document.body.dataset.view = s.view;
  header();
  if (s.view === 'intro') renderIntro(stage, ctx);
  else if (s.view === 'q') renderQuestion(stage, ctx);
  else stage.innerHTML = `<p class="hint">${esc(s.view)}</p>`;
}

$('#lang').addEventListener('click', () => {
  store.set({ lang: store.get().lang === 'zh' ? 'en' : 'zh' });
  render();
});
store.subscribe(header);
history.replaceState({ view: store.get().view, step: store.get().step }, '');
render();
