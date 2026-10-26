import type { Locale } from '../core/types';
import { en } from './en';
import { zh, type MessageKey } from './zh';

export type { MessageKey };
const DICTS: Record<Locale, Record<MessageKey, string>> = { zh, en };

export function t(locale: Locale, key: MessageKey, vars: Record<string, string | number> = {}): string {
  return DICTS[locale][key].replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}
