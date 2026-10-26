const query = matchMedia('(prefers-reduced-motion: reduce)');

// 每次实时读取，用户中途改系统设置也立即生效
export const prefersReducedMotion = () => query.matches;

export function countTo(el: HTMLElement, from: number, to: number, fmt: (n: number) => string, signal: AbortSignal) {
  if (prefersReducedMotion()) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const duration = 650;
  const tick = (now: number) => {
    if (signal.aborted) return;
    const p = Math.min(1, (now - t0) / duration);
    el.textContent = fmt(from + (to - from) * (1 - (1 - p) ** 3));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
