import { Injectable } from '@angular/core';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

/**
 * Stand-in for a proprietary analytics SDK. Real BofA integrations of this
 * kind are typically loaded as an external script/global, not an npm
 * package -- modeled here as a thin wrapper service for the same reason,
 * so an upgrade has to preserve the *integration boundary* rather than
 * being able to freely refactor internals.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private queue: AnalyticsEvent[] = [];

  track(event: AnalyticsEvent): void {
    // In production this would call out to `window.bofaAnalytics.track(...)`
    // or similar. Queuing here keeps the demo runnable without a real SDK.
    this.queue.push(event);
  }

  flush(): AnalyticsEvent[] {
    const events = [...this.queue];
    this.queue = [];
    return events;
  }
}
