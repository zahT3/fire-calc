import type { FieldKey } from '../../core/parse';
import type { MessageKey } from '../../i18n';
import { esc, type Ctx } from '../ctx';
import { errorFor, type AppState } from '../store';

function assumeInput(s: AppState, ctx: Ctx, key: FieldKey, label: MessageKey): string {
  const err = errorFor(s, key);
  return `<label class="assume__field">${esc(ctx.t(label))}
    <input class="mono" name="${key}" inputmode="decimal" value="${esc(s.text[key] ?? '')}" aria-invalid="${!!err}"> %</label>`;
}

// 回报与通胀的假设面板；结果页和"我现在有多少"共用
export function assumeHTML(s: AppState, ctx: Ctx): string {
  // 按 2% 算的数放在折叠区外：让人不展开也知道视频取的是乐观值
  return `
    <p class="alt" id="alt"></p>
    <details class="assume">
      <summary>${esc(ctx.t('result.assume'))} ⓘ</summary>
      <p id="assumeBody"></p>
      <div class="assume__inputs">${assumeInput(s, ctx, 'nominalReturn', 'result.return')} −
        ${assumeInput(s, ctx, 'inflation', 'result.inflation')}</div>
    </details>`;
}

export function bindAssume(root: HTMLElement, ctx: Ctx, onChange: () => void) {
  root.querySelectorAll<HTMLInputElement>('.assume input').forEach((inp) => inp.addEventListener('input', () => {
    ctx.store.set({ text: { ...ctx.store.get().text, [inp.name]: inp.value } });
    inp.setAttribute('aria-invalid', String(!!errorFor(ctx.store.get(), inp.name as FieldKey)));
    onChange();
  }));
}
