import { allocateCells, pickUnit } from '../core/cells';
import { PART_KEYS, type Breakdown, type PartKey } from '../core/types';

// 正在飞入的格子：重绘时保持隐藏，落位后再显示
const pending = new Set<number>();

export interface BoardInfo {
  unit: number;
  cells: number;
  counts: Breakdown;
}

const cols = (el: HTMLElement) => parseInt(getComputedStyle(el).getPropertyValue('--cols'), 10) || 20;

export function renderBoard(el: HTMLElement, parts: Breakdown, opts: { lit?: number | null } = {}): BoardInfo {
  const total = PART_KEYS.reduce((s, k) => s + parts[k], 0);
  const unit = pickUnit(total);
  const { counts, cells } = allocateCells(parts, unit);
  const c = cols(el);
  const cap = Math.max(Math.ceil(cells / c) * c, c * 5);
  const owner: PartKey[] = PART_KEYS.flatMap((k) => Array<PartKey>(counts[k]).fill(k));
  let html = '';
  for (let i = 0; i < cap; i++) {
    const part = owner[i];
    if (!part) { html += '<i></i>'; continue; }
    const cls = opts.lit == null ? '' : i < opts.lit ? ' class="lit"' : ' class="dim"';
    html += `<i data-i="${i}"${cls} style="background:var(--${part})${pending.has(i) ? ';opacity:0' : ''}"></i>`;
  }
  el.innerHTML = html;
  return { unit, cells, counts };
}

export function indexesOf(counts: Breakdown, part: PartKey): number[] {
  let start = 0;
  for (const k of PART_KEYS) {
    if (k === part) return Array.from({ length: counts[k] }, (_, i) => start + i);
    start += counts[k];
  }
  return [];
}

const reveal = (grid: HTMLElement, i: number) => {
  pending.delete(i);
  const cell = grid.querySelector<HTMLElement>(`[data-i="${i}"]`);
  if (cell) cell.style.opacity = '';
};

const MAX_FLYING = 120;

// 从题卡的位置碎成格子飞进方格；按格子编号找落点，重绘后也能落到正确位置
export function flyInto(from: DOMRect, grid: HTMLElement, indexes: number[], color: string, signal: AbortSignal): Promise<void> {
  indexes.forEach((i) => pending.add(i));
  const flights: Promise<void>[] = [];
  const flies: HTMLElement[] = [];
  const finishAll = () => {
    flies.forEach((f) => f.remove());
    indexes.forEach((i) => reveal(grid, i));
  };
  signal.addEventListener('abort', finishAll, { once: true });

  indexes.forEach((i, n) => {
    const target = grid.querySelector<HTMLElement>(`[data-i="${i}"]`);
    if (!target) return reveal(grid, i);
    if (n >= MAX_FLYING) {
      flights.push(new Promise((done) => setTimeout(() => { reveal(grid, i); done(); }, 650)));
      return;
    }
    const to = target.getBoundingClientRect();
    const fly = document.createElement('i');
    fly.className = 'fly';
    const sx = from.left + Math.random() * Math.max(from.width - to.width, 0);
    const sy = from.top + Math.random() * from.height * 0.75;
    Object.assign(fly.style, { left: `${sx}px`, top: `${sy}px`, width: `${to.width}px`, height: `${to.height}px`, background: color });
    document.body.appendChild(fly);
    flies.push(fly);
    const rot = Math.random() * 120 - 60;
    const anim = fly.animate(
      [
        { transform: `translate(0,0) rotate(${rot}deg) scale(1.8)`, opacity: 0.85 },
        { transform: `translate(${to.left - sx}px,${to.top - sy}px) rotate(0deg) scale(1)`, opacity: 1 },
      ],
      { duration: 520 + Math.random() * 280, delay: n * 5, easing: 'cubic-bezier(.2,.7,.15,1)', fill: 'forwards' },
    );
    flights.push(anim.finished.then(() => { fly.remove(); reveal(grid, i); }, () => {}));
  });
  return Promise.all(flights).then(() => undefined);
}
