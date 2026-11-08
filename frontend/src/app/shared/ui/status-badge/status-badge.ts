import { Component, Input } from '@angular/core';

export type BadgeTone = 'neutral' | 'brand' | 'live' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'mio-status-badge',
  standalone: true,
  template: `
    <span class="mio-badge" [attr.data-tone]="tone">
      @if (dot) {
        <span class="mio-badge__dot" aria-hidden="true"></span>
      }
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    .mio-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-pill);
      font-size: var(--text-xs);
      font-weight: 650;
      line-height: 1.3;
      border: 1px solid var(--border);
      background-color: var(--surface-subtle);
      color: var(--ink-secondary);
      transition: background-color var(--duration-fast) var(--ease-out),
                  border-color var(--duration-fast) var(--ease-out),
                  color var(--duration-fast) var(--ease-out);
    }
    .mio-badge__dot {
      position: relative;
      inline-size: 6px;
      block-size: 6px;
      border-radius: 50%;
      background-color: currentColor;
      flex-shrink: 0;
    }
    .mio-badge[data-tone='live'] .mio-badge__dot::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      background-color: currentColor;
      opacity: 0;
      animation: mio-live-pulse 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .mio-badge[data-tone='live'] .mio-badge__dot::after {
        animation: none;
      }
    }
    @keyframes mio-live-pulse {
      0% {
        transform: scale(0.85);
        opacity: 0.55;
      }
      70% {
        transform: scale(2.15);
        opacity: 0;
      }
      100% {
        transform: scale(2.15);
        opacity: 0;
      }
    }
    .mio-badge[data-tone='brand'] {
      background-color: var(--brand-soft);
      border-color: var(--brand-border);
      color: var(--brand);
    }
    .mio-badge[data-tone='live'] {
      background-color: var(--live);
      border-color: var(--live);
      color: #ffffff;
    }
    .mio-badge[data-tone='success'] {
      background-color: var(--success-soft);
      border-color: var(--success-border);
      color: var(--success);
    }
    .mio-badge[data-tone='warning'] {
      background-color: var(--warning-soft);
      border-color: var(--warning-border);
      color: var(--warning);
    }
    .mio-badge[data-tone='danger'] {
      background-color: var(--danger-soft);
      border-color: var(--danger-border);
      color: var(--danger);
    }
  `],
})
export class StatusBadgeComponent {
  @Input() tone: BadgeTone = 'neutral';
  @Input() dot = false;
}
