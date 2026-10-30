import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-outlook-page',
  standalone: true,
  imports: [TranslocoDirective],
  templateUrl: './outlook.page.html',
  styleUrl: './outlook.page.scss',
})
export class OutlookPage {}
