import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BdsButtonComponent } from './bds-button.component';

describe('BdsButtonComponent', () => {
  let component: BdsButtonComponent;
  let fixture: ComponentFixture<BdsButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BdsButtonComponent],
      imports: [MatButtonModule, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(BdsButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit bdsClick when enabled', () => {
    const spy = jasmine.createSpy('bdsClick');
    component.bdsClick.subscribe(spy);
    component.onClick(new MouseEvent('click'));
    expect(spy).toHaveBeenCalled();
  });

  it('should NOT emit bdsClick when disabled', () => {
    // NOTE: does not cover the `loading` guard path, or the secondary/danger
    // variant templates at all -- representative of the "some paths tested,
    // most not" state the team described.
    const spy = jasmine.createSpy('bdsClick');
    component.disabled = true;
    component.bdsClick.subscribe(spy);
    component.onClick(new MouseEvent('click'));
    expect(spy).not.toHaveBeenCalled();
  });
});
