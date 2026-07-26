import { Component, Input } from '@angular/core';
import { BdsAlertSeverity } from '../tokens/design-tokens';

/**
 * Used across consuming apps for compliance-sensitive messaging
 * (fraud alerts, regulatory disclosures, session/MFA warnings), so
 * behavior here is treated as change-managed: any modification needs
 * sign-off outside the design-system team, mirroring how BofA described
 * shared-library governance in the intro call.
 */
@Component({
  selector: 'bds-alert-banner',
  templateUrl: './bds-alert-banner.component.html',
  styleUrls: ['./bds-alert-banner.component.scss'],
})
export class BdsAlertBannerComponent {
  @Input() severity: BdsAlertSeverity = 'info';
  @Input() dismissible = true;
}
