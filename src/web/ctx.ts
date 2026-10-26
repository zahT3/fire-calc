import { t as translate, type MessageKey } from '../i18n';
import type { AppState, Store } from './store';

export interface Ctx {
  store: Store;
  t(key: MessageKey, vars?: Record<string, string | number>): string;
  // 改变视图或题号并写入浏览历史，让手机返回键回到上一屏
  go(patch: Partial<AppState>): void;
  // 确认当前题，交给 main 决定动画和下一屏
  confirm(from: DOMRect | null): void;
}

export function makeT(store: Store): Ctx['t'] {
  return (key, vars) => translate(store.get().lang, key, vars);
}

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
