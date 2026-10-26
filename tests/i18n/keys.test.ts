import { en } from '../../src/i18n/en';
import { t } from '../../src/i18n';
import { zh } from '../../src/i18n/zh';
import { CN } from '../../src/regions/cn';
import { computeTarget } from '../../src/core/calc';

test('两种语言键一致', () => {
  expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
});

test('英文文案不留空（region.note 除外的中文可以为空）', () => {
  for (const [k, v] of Object.entries(en)) expect(v, k).not.toBe('');
});

test('变量替换', () => {
  expect(t('zh', 'progress.gap', { v: '1,270 万' })).toBe('还差 1,270 万');
  expect(t('en', 'region.note')).toBe('Based on China data, amounts in CNY');
});

test('视频示例数据算出 1870 万', () => {
  const r = computeTarget(CN.videoExample);
  expect(r.ok && r.total).toBeCloseTo(18_700_000);
  expect(CN.videoExample.assets).toBe(6_000_000);
});

test('参考值从低到高排列', () => {
  for (const [k, list] of Object.entries(CN.refs)) {
    const values = list.map((r) => r.value);
    expect(values, k).toEqual([...values].sort((a, b) => a - b));
  }
});
