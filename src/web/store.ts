import { parseField, type FieldKey, type ParseError, type Parsed } from '../core/parse';
import { DEFAULT_INFLATION, DEFAULT_RETURN, type Housing, type Inputs, type Locale, type PartKey } from '../core/types';

export type View = 'intro' | 'q' | 'result' | 'progress';
export const STEPS: readonly PartKey[] = ['living', 'kids', 'medical', 'house'];

// 输入框里的原文是唯一来源，数值每次从原文推导，避免"显示的数"和"参与计算的数"不一致
export interface AppState {
  view: View;
  step: number;
  answered: Set<PartKey>;
  text: Partial<Record<FieldKey, string>>;
  kidsMore: boolean;
  housing: Housing | null;
  demo: boolean;
  resultSeen: boolean;
  lang: Locale;
}

export function initialState(lang: Locale): AppState {
  return {
    view: 'intro', step: 0, answered: new Set(), text: { nominalReturn: '4.5', inflation: '2' },
    kidsMore: false, housing: null, demo: false, resultSeen: false, lang,
  };
}

export interface Store {
  get(): AppState;
  set(patch: Partial<AppState>): void;
  subscribe(fn: (s: AppState) => void): () => void;
}

export function createStore(initial: AppState): Store {
  let state = initial;
  const subs = new Set<(s: AppState) => void>();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      for (const fn of subs) fn(state);
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export const field = (s: AppState, key: FieldKey): Parsed => parseField(key, s.text[key] ?? '');

// 空着不算错，只是还不能下一步；填了不合法的内容才提示
export function errorFor(s: AppState, key: FieldKey): ParseError | null {
  const p = field(s, key);
  return p.ok || p.error === 'empty' ? null : p.error;
}

const valueOr = (s: AppState, key: FieldKey, fallback: number) => {
  const p = field(s, key);
  return p.ok ? p.value : fallback;
};

export function kidsCount(s: AppState): number | null {
  const p = field(s, 'kids');
  return p.ok ? p.value : null;
}

export function stepValid(s: AppState, part: PartKey): boolean {
  if (part === 'living') return field(s, 'monthlySpend').ok;
  if (part === 'kids') {
    const n = kidsCount(s);
    return n !== null && (n === 0 || field(s, 'perKid').ok);
  }
  if (part === 'medical') return field(s, 'medical').ok;
  return s.housing !== null && (s.housing !== 'buy' || field(s, 'house').ok);
}

export function deriveInputs(s: AppState): Inputs {
  return {
    monthlySpend: valueOr(s, 'monthlySpend', 0),
    kids: kidsCount(s) ?? 0,
    perKid: valueOr(s, 'perKid', 0),
    medical: valueOr(s, 'medical', 0),
    housing: s.housing ?? 'own',
    house: valueOr(s, 'house', 0),
    nominalReturn: valueOr(s, 'nominalReturn', DEFAULT_RETURN),
    inflation: valueOr(s, 'inflation', DEFAULT_INFLATION),
  };
}

export const firstUnanswered = (s: AppState): number => STEPS.findIndex((p) => !s.answered.has(p));
