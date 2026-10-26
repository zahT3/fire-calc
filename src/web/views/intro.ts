import { CN } from '../../regions/cn';
import { esc, type Ctx } from '../ctx';

export function renderIntro(root: HTMLElement, ctx: Ctx) {
  const { t } = ctx;
  const note = t('region.note');
  const video = CN.sources.find((s) => s.url.includes('bilibili'))!;
  root.innerHTML = `
    <section class="intro">
      <h1 tabindex="-1">${esc(t('app.title'))}</h1>
      <p class="lead">${esc(t('app.lead'))}</p>
      ${note ? `<p class="note">${esc(note)}</p>` : ''}
      <div class="spacer"></div>
      <button class="btn btn--light" id="start">${esc(t('intro.start'))}</button>
      <button class="btn btn--ghost" id="demo">${esc(t('intro.demo'))}</button>
      <p class="fine">${esc(t('intro.privacy'))} · <a href="${video.url}" target="_blank" rel="noopener">${esc(t('intro.video'))}</a></p>
    </section>`;
  root.querySelector('#start')!.addEventListener('click', () => ctx.go({ view: 'q', step: 0, demo: false }));
  root.querySelector('#demo')!.addEventListener('click', () => {
    const v = CN.videoExample;
    const s = ctx.store.get();
    ctx.store.set({
      text: { ...s.text, monthlySpend: String(v.monthlySpend), kids: String(v.kids), perKid: String(v.perKid / 1e4),
        medical: String(v.medical / 1e4), house: String(v.house / 1e4) },
      housing: v.housing, kidsMore: false, answered: new Set(['living', 'kids', 'medical', 'house']), resultSeen: true,
    });
    ctx.go({ view: 'result', demo: true });
  });
}
