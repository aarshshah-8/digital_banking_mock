import { Component, Input } from '@angular/core';

@Component({
  selector: 'bds-card',
  templateUrl: './bds-card.component.html',
  styleUrls: ['./bds-card.component.scss'],
})
export class BdsCardComponent {
  @Input() title = '';
  @Input() elevated = true;
}
