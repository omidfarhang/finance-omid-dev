import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-support-page',
  standalone: true,
  imports: [RouterLink, TranslocoDirective],
  templateUrl: './support.page.html',
  styleUrl: './support.page.scss',
})
export class SupportPage {}
