import { encode } from 'uqr';
import { computeTarget } from '../core/calc';
import { allocateCells, pickUnit } from '../core/cells';
import { formatBreakdown, formatMoney } from '../core/format';
import { encodeLink, type LinkState } from '../core/link';
import type { FieldKey } from '../core/parse';
import { PART_KEYS, type PartKey } from '../core/types';
import type { MessageKey } from '../i18n';
import { esc, type Ctx } from './ctx';
import { deriveInputs, field, type AppState } from './store';

const LINK_FIELDS: Exclude<FieldKey, 'assets'>[] = ['monthlySpend', 'kids', 'perKid', 'medical', 'house', 'nominalReturn', 'inflation'];
const COLORS: Record<PartKey, string> = { living: '#bcff2f', kids: '#f0a58c', medical: '#b9d3c9', house: '#e9dcc6' };
const TAB_KEY: Record<PartKey, MessageKey> = { living: 'tab.living', kids: 'tab.kids', medical: 'tab.medical', house: 'tab.house' };

export function linkState(s: AppState): LinkState {
  const inputs: LinkState['inputs'] = {};
  for (const key of LINK_FIELDS) {
    const p = field(s, key);
    if (p.ok) inputs[key] = p.value;
  }
  if (s.housing) inputs.housing = s.housing;
  const assets = field(s, 'assets');
  return { inputs, assets: assets.ok ? assets.value : undefined, lang: s.lang, demo: s.demo || undefined };
}

export function shareUrl(s: AppState): string {
  return `${location.origin}${location.pathname}?${encodeLink(linkState(s))}`;
}

// 开场页保持干净网址；其余页面随输入更新，刷新或转发都能复现
export function syncUrl(s: AppState) {
  const url = s.view === 'intro' ? location.pathname : `${location.pathname}?${encodeLink(linkState(s))}`;
  history.replaceState(history.state, '', url);
}

export async function copyLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

const FONT = '-apple-system, "PingFang SC", "Helvetica Neue", "Noto Sans SC", sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

// 白底留边，模块按整数像素画，被平台压缩后也容易扫
function drawQr(g: CanvasRenderingContext2D, text: string, right: number, bottom: number, maxSize: number): number {
  const qr = encode(text, { ecc: 'M', border: 2 });
  const mod = Math.floor(maxSize / qr.size), size = mod * qr.size;
  const x = right - size, y = bottom - size;
  g.fillStyle = '#fff';
  g.fillRect(x, y, size, size);
  g.fillStyle = '#000';
  qr.data.forEach((row, r) => row.forEach((dark, c) => { if (dark) g.fillRect(x + c * mod, y + r * mod, mod, mod); }));
  return x;
}

export async function makeShareImage(s: AppState, ctx: Ctx): Promise<Blob> {
  const W = 1080, H = 1440, PAD = 80;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  g.textBaseline = 'alphabetic';

  const r = computeTarget(deriveInputs(s));
  g.fillStyle = '#8a8a8a';
  g.font = `500 34px ${FONT}`;
  g.fillText(ctx.t('app.title'), PAD, 130);
  if (s.demo) {
    g.fillStyle = COLORS.living;
    g.font = `600 28px ${FONT}`;
    g.fillText(ctx.t('result.demo'), PAD, 180);
  }
  if (!r.ok) {
    g.fillStyle = '#fff';
    g.font = `500 40px ${FONT}`;
    g.fillText(ctx.t('result.nonPositive').slice(0, 24), PAD, 400);
  } else {
    g.fillStyle = '#8a8a8a';
    g.font = `500 32px ${FONT}`;
    g.fillText(ctx.t('top.result'), PAD, 260);
    g.fillStyle = COLORS.living;
    g.font = `800 132px ${MONO}`;
    g.fillText(formatMoney(r.total, s.lang), PAD - 6, 390);

    const { counts, cells } = allocateCells(r.parts, pickUnit(r.total));
    const cols = 20, gap = 6, size = (W - PAD * 2 - gap * (cols - 1)) / cols;
    const owner = PART_KEYS.flatMap((k) => Array<PartKey>(counts[k]).fill(k));
    for (let i = 0; i < cells; i++) {
      g.fillStyle = COLORS[owner[i]!];
      g.fillRect(PAD + (i % cols) * (size + gap), 440 + Math.floor(i / cols) * (size + gap), size, size);
    }

    const f = formatBreakdown(r.parts, r.total, s.lang);
    let y = 440 + Math.ceil(cells / cols) * (size + gap) + 70;
    for (const k of PART_KEYS) {
      g.fillStyle = COLORS[k];
      g.fillRect(PAD, y - 24, 26, 26);
      g.fillStyle = '#ccc';
      g.font = `500 34px ${FONT}`;
      g.fillText(ctx.t(TAB_KEY[k]), PAD + 46, y);
      g.fillStyle = '#fff';
      g.font = `600 34px ${MONO}`;
      g.textAlign = 'right';
      g.fillText(f.parts[k], W - PAD, y);
      g.textAlign = 'left';
      y += 54;
    }
  }

  // 二维码只放干净网址：扫进来的人从开场页开始算自己的，码也更稀疏好扫
  const site = `${location.host}${location.pathname}`;
  const qrLeft = drawQr(g, `${location.protocol}//${site}`, W - PAD, H - 60, 220);
  const textW = qrLeft - PAD - 32;
  g.fillStyle = '#fff';
  g.font = `600 44px ${FONT}`;
  g.fillText(ctx.t('share.scan'), PAD, H - 215, textW);
  g.fillStyle = '#8a8a8a';
  g.font = `400 28px ${FONT}`;
  if (r.ok) g.fillText(ctx.t('share.assume', { r: Number((r.realReturn * 100).toFixed(2)), m: Math.round(r.multiplier) }), PAD, H - 155, textW);
  g.fillText(ctx.t('result.basis'), PAD, H - 110, textW);
  g.fillStyle = '#777';
  g.font = `400 26px ${MONO}`;
  g.fillText(site, PAD, H - 64, textW);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}

// 先给预览：用户看到图再决定长按保存、下载或调用系统分享
export function showShareSheet(blob: Blob, ctx: Ctx) {
  const url = URL.createObjectURL(blob);
  const file = new File([blob], 'fire-calc.png', { type: 'image/png' });
  const canNative = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', ctx.t('result.share'));
  sheet.innerHTML = `
    <div class="sheet__body">
      <img id="shareImg" src="${url}" alt="${esc(ctx.t('app.title'))}">
      <p class="sheet__hint">${esc(ctx.t('share.hint'))}</p>
      <div class="sheet__actions">
        ${canNative ? `<button class="btn btn--light" id="shareNative">${esc(ctx.t('share.native'))}</button>` : ''}
        <a class="btn btn--ghost" href="${url}" download="fire-calc.png">${esc(ctx.t('share.download'))}</a>
        <button class="btn btn--ghost" id="shareClose">${esc(ctx.t('share.close'))}</button>
      </div>
    </div>`;
  const close = () => { sheet.remove(); URL.revokeObjectURL(url); };
  sheet.querySelector('#shareClose')!.addEventListener('click', close);
  sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  sheet.querySelector('#shareNative')?.addEventListener('click', () => {
    navigator.share({ files: [file], title: ctx.t('app.title') }).catch(() => {});
  });
  document.body.appendChild(sheet);
  sheet.querySelector<HTMLElement>('#shareClose')!.focus();
}
