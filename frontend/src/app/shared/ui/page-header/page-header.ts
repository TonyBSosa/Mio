import { Component, Input } from '@angular/core';

@Component({
  selector: 'mio-page-header',
  standalone: true,
  template: `
    <header class="mio-page-header">
      <div class="mio-page-header__titles">
        @if (kicker) {
          <span class="mio-page-header__kicker">{{ kicker }}</span>
        }
        <h2 class="mio-page-header__title">{{ title }}</h2>
        @if (subtitle) {
          <p class="mio-page-header__subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="mio-page-header__actions">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [`
    .mio-page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: var(--space-4);
      padding-block-end: var(--space-4);
      margin-block-end: var(--space-6);
      border-block-end: 1px solid var(--border);
    }
    .mio-page-header__kicker {
      display: inline-block;
      font-size: var(--text-xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--brand);
      margin-block-end: var(--space-1);
    }
    .mio-page-header__title {
      margin: 0;
      font-size: var(--text-xl);
      font-weight: 750;
      letter-spacing: -0.03em;
      color: var(--ink);
    }
    .mio-page-header__subtitle {
      margin: var(--space-1) 0 0;
      font-size: var(--text-sm);
      color: var(--muted);
    }
    .mio-page-header__actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  `],
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() kicker = '';
}
