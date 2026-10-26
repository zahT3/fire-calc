import { DEFAULT_INFLATION, DEFAULT_RETURN } from '../core/types';
import type { Region } from './types';

const UNVERIFIED = { zh: '视频引用，未核实原始出处', en: 'Quoted in the video, original source not verified' };

export const CN: Region = {
  id: 'cn',
  currency: 'CNY',
  symbol: '¥',
  refs: {
    monthlySpend: [
      // 国家统计局 2025 年全国居民人均消费支出 29,476 元/年 ÷ 12
      { value: 2456, label: { zh: '全国平均 2,456', en: 'China avg ¥2,456' },
        note: { zh: '2025 年全国居民人均消费支出，国家统计局', en: 'Per-capita consumer spending, 2025, NBS' } },
      // 城镇居民 35,869 元/年 ÷ 12 ≈ 2,989，视频取整为 2,990
      { value: 2990, label: { zh: '城镇平均 2,990', en: 'Urban avg ¥2,990' },
        note: { zh: '2025 年城镇居民人均消费支出，国家统计局', en: 'Urban per-capita spending, 2025, NBS' } },
      { value: 8000, label: { zh: '8,000', en: '¥8,000' } },
      { value: 15000, label: { zh: '15,000', en: '¥15,000' } },
    ],
    perKid: [
      { value: 580_000, label: { zh: '全国平均 58 万', en: 'China avg ¥580K' },
        note: { zh: '从备孕养到 18 岁，2024 年数据，《中国生育成本报告 2026》', en: 'From pregnancy to age 18, 2024 data, China Fertility Cost Report 2026' } },
      { value: 1_000_000, label: { zh: '100 万', en: '¥1M' } },
      { value: 1_500_000, label: { zh: '150 万', en: '¥1.5M' } },
    ],
    medical: [
      { value: 200_000, label: { zh: '全国人均 20 万', en: 'China avg ¥200K' },
        note: { zh: '视频按人均医疗支出乘以人均寿命粗估', en: 'Video estimate: per-capita health spending × life expectancy' } },
      { value: 300_000, label: { zh: '30 万', en: '¥300K' }, note: UNVERIFIED },
      { value: 600_000, label: { zh: '60 万', en: '¥600K' }, note: UNVERIFIED },
      { value: 1_500_000, label: { zh: '150 万', en: '¥1.5M' } },
    ],
    house: [
      { value: 1_200_000, label: { zh: '120 万', en: '¥1.2M' } },
      { value: 3_000_000, label: { zh: '300 万', en: '¥3M' } },
      { value: 7_000_000, label: { zh: '700 万', en: '¥7M' } },
    ],
    assets: [
      { value: 1_000_000, label: { zh: '100 万', en: '¥1M' } },
      { value: 3_000_000, label: { zh: '300 万', en: '¥3M' } },
      { value: 6_000_000, label: { zh: '600 万', en: '¥6M' } },
      { value: 10_000_000, label: { zh: '1,000 万', en: '¥10M' } },
    ],
  },
  sources: [
    { label: '国家统计局：2025 年居民收入和消费支出情况', url: 'https://www.stats.gov.cn/sj/zxfb/202601/t20260119_1962321.html', year: 2025 },
    { label: '育娲人口智库：中国生育成本报告 2026', url: 'https://file.c-ctrip.com/files/6/yuwa/0R74p12000smu5mcx984C.pdf', year: 2026 },
    { label: '小Lin说：你需要多少钱，才能财富自由？', url: 'https://www.bilibili.com/video/BV1yUHP6rEYD/', year: 2026 },
  ],
  videoExample: {
    monthlySpend: 15000, kids: 2, perKid: 1_500_000, medical: 1_500_000,
    housing: 'buy', house: 7_000_000, nominalReturn: DEFAULT_RETURN, inflation: DEFAULT_INFLATION,
    assets: 6_000_000,
  },
};
