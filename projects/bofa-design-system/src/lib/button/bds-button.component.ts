import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BdsButtonVariant } from '../tokens/design-tokens';

/**
 * BDS Button
 *
 * Thin wrapper around Angular Material's button so that consuming apps never
 * import MatButtonModule directly. This indirection is what lets BDS absorb
 * Material's MDC-based component migration (v15+) without downstream teams
 * needing to touch their templates.
 */
@Component({
  selector: 'bds-button',
  templateUrl: './bds-button.component.html',
  styleUrls: ['./bds-button.component.scss'],
})
export class BdsButtonComponent {
  @Input() variant: BdsButtonVariant = 'primary';
  @Input() disabled = false;
  @Input() loading = false;
  @Output() bdsClick = new EventEmitter<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (this.disabled || this.loading) {
      return;
    }
    this.bdsClick.emit(event);
  }
}
