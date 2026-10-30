import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-import-page',
  standalone: true,
  imports: [TranslocoDirective],
  templateUrl: './import.page.html',
  styleUrl: './import.page.scss',
})
export class ImportPage {}
