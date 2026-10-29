import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { LocaleService } from './core/i18n/locale.service';
import { TranslocoHttpLoader } from './core/i18n/transloco-loader';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideTransloco({
          config: {
            availableLangs: ['fa', 'en'],
            defaultLang: 'fa',
            reRenderOnLangChange: true,
          },
          loader: TranslocoHttpLoader,
        }),
        {
          provide: LocaleService,
          useValue: {
            langs: [
              { id: 'fa', labelKey: 'app.lang.fa', dir: 'rtl' },
              { id: 'en', labelKey: 'app.lang.en', dir: 'ltr' },
            ],
            activeLang: () => 'fa',
            setLang: () => Promise.resolve(),
            init: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();

    const loader = TestBed.inject(TranslocoHttpLoader);
    vi.spyOn(loader, 'getTranslation').mockReturnValue(of({}));
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
