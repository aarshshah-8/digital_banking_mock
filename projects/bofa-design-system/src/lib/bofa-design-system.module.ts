import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { BdsButtonComponent } from './button/bds-button.component';
import { BdsCardComponent } from './card/bds-card.component';
import { BdsAlertBannerComponent } from './alert-banner/bds-alert-banner.component';

/**
 * NOTE: this module is NgModule-based, consistent with the rest of the
 * codebase at the time of the 14 -> 18 upgrade kickoff. Converting to
 * standalone components is an available modernization step in v15+/v17+
 * but is NOT required to complete the upgrade, and is intentionally left
 * as an optional follow-on rather than bundled into the compliance-driven
 * upgrade itself, to keep the two concerns (must-do vs nice-to-do) separate.
 */
@NgModule({
  declarations: [BdsButtonComponent, BdsCardComponent, BdsAlertBannerComponent],
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  exports: [BdsButtonComponent, BdsCardComponent, BdsAlertBannerComponent],
})
export class BofaDesignSystemModule {}
