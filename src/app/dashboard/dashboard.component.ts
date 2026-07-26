import { Component, OnInit } from '@angular/core';
import { AuthService, SsoSession } from '../core/auth/auth.service';
import { AnalyticsService } from '../core/analytics/analytics.service';
import { AccountBalance, MarketDataService } from '../core/market-data/market-data.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  session?: SsoSession;
  balances: AccountBalance[] = [];
  loading = true;

  constructor(
    private auth: AuthService,
    private analytics: AnalyticsService,
    private marketData: MarketDataService
  ) {}

  async ngOnInit(): Promise<void> {
    this.session = await this.auth.establishSession('demo-user');
    this.marketData.getBalances('acct-001').subscribe((balances) => {
      this.balances = balances;
      this.loading = false;
    });
    this.analytics.track({ name: 'dashboard_viewed' });
  }

  onTransferClick(): void {
    this.analytics.track({ name: 'transfer_button_clicked' });
  }
}
