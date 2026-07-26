import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'digital-banking-shell'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('digital-banking-shell');
  });

  // NOTE: no assertion on rendered DOM content here. The dashboard route
  // component (DashboardComponent) has zero test coverage of its own --
  // representative of the "compliance-critical path with no tests" gap
  // described in the test-coverage use case (this route exercises the
  // auth/session and balance-display path).
});
