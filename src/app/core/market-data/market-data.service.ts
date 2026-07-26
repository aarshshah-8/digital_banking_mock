import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AccountBalance {
  accountId: string;
  balance: number;
  currency: 'USD';
  asOf: string;
}

/**
 * Stand-in for a third-party financial data provider integration
 * (e.g. balance/transaction feeds). Modeled as a service with a narrow,
 * explicit interface so upgrade tooling has a clear contract to preserve.
 */
@Injectable({ providedIn: 'root' })
export class MarketDataService {
  constructor(private http: HttpClient) {}

  getBalances(accountId: string): Observable<AccountBalance[]> {
    return of<AccountBalance[]>([
      { accountId, balance: 4231.09, currency: 'USD', asOf: new Date().toISOString() },
    ]).pipe(
      catchError(() => of<AccountBalance[]>([]))
    );
  }
}
