import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface SsoSession {
  userId: string;
  mfaVerified: boolean;
  entitlements: string[];
  expiresAt: number;
}

/**
 * Stand-in for BofA's internal SSO/MFA integration.
 *
 * This is intentionally a thin mock: the demo does not attempt to model
 * real SSO/MFA business logic, only its *call shape*, so that an upgrade
 * agent has to reason about a call site it cannot simply delete or bypass.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  /**
   * NOTE (intentional legacy pattern): `toPromise()` has been deprecated
   * since RxJS 7 in favor of `firstValueFrom`/`lastValueFrom`, and is
   * removed entirely in RxJS 8. Any Angular 14 -> 18 upgrade that also
   * bumps RxJS to a current major needs to catch and migrate call sites
   * like this one.
   */
  async establishSession(username: string): Promise<SsoSession> {
    return this.mockSsoHandshake(username).toPromise() as Promise<SsoSession>;
  }

  verifyMfaChallenge(code: string): Observable<boolean> {
    return of(code.length === 6).pipe(delay(150));
  }

  private mockSsoHandshake(username: string): Observable<SsoSession> {
    return of({
      userId: username,
      mfaVerified: false,
      entitlements: ['retail-banking:read', 'retail-banking:transact'],
      expiresAt: Date.now() + 1000 * 60 * 15,
    }).pipe(delay(200));
  }
}
