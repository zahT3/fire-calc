import type { Inputs, Locale } from '../core/types';

// value 用核心单位（元）
export interface RefValue {
  value: number;
  label: Record<Locale, string>;
  note?: Record<Locale, string>;
}

export type RefField = 'monthlySpend' | 'perKid' | 'medical' | 'house' | 'assets';

export interface Source {
  label: string;
  url: string;
  year: number;
}

export interface Region {
  id: 'cn';
  currency: 'CNY';
  symbol: '¥';
  refs: Record<RefField, RefValue[]>;
  sources: Source[];
  videoExample: Inputs & { assets: number };
}
