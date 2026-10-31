import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DEFAULT_THEME,
  type CalendarSystem,
  type ThemePreference,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { AuthService } from '../../core/auth.service';
import { CalendarPreferenceService } from '../../core/calendar-preference.service';
import { LocaleService } from '../../core/i18n/locale.service';
import { UiLang } from '../../core/i18n/supported-langs';
import {
  ensureTimeZoneOption,
  listTimeZones,
} from '../../core/i18n/time-zones';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { ThemePreferenceService } from '../../core/theme-preference.service';

type ThemeOption = {
  label: string;
  value: ThemePreference;
  icon: string;
};

type SelectOption<T extends string> = {
  label: string;
  value: T;
};

@Component({
  selector: 'app-settings-profile-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    Message,
    Select,
    SelectButton,
    TranslocoDirective,
  ],
  templateUrl: './settings-profile.page.html',
  styleUrl: './settings-profile.page.scss',
})
export class SettingsProfilePage implements OnInit {
  displayName = '';
  timeZone: string | null = null;
  calendar: CalendarSystem = 'JALALI';
  theme: ThemePreference = DEFAULT_THEME;
  timeZoneOptions: SelectOption<string>[] = [];
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  loading = signal(false);

  readonly auth = inject(AuthService);
  readonly localeService = inject(LocaleService);
  readonly calendarPreference = inject(CalendarPreferenceService);
  readonly themePreference = inject(ThemePreferenceService);
  readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly i18n = inject(TranslocoService);

  readonly localeOptions = computed((): SelectOption<UiLang>[] =>
    this.localeService.langs.map((lang) => ({
      label: this.i18n.translate(lang.labelKey),
      value: lang.id,
    })),
  );

  readonly calendarSelectOptions = computed(
    (): SelectOption<CalendarSystem>[] => [
      {
        label: this.i18n.translate('settings.calendarJalali'),
        value: 'JALALI',
      },
      {
        label: this.i18n.translate('settings.calendarGregorian'),
        value: 'GREGORIAN',
      },
    ],
  );

  readonly themeOptions = computed((): ThemeOption[] => [
    {
      label: this.i18n.translate('settings.themeLight'),
      value: 'LIGHT',
      icon: 'pi pi-sun',
    },
    {
      label: this.i18n.translate('settings.themeDark'),
      value: 'DARK',
      icon: 'pi pi-moon',
    },
    {
      label: this.i18n.translate('settings.themeSystem'),
      value: 'SYSTEM',
      icon: 'pi pi-desktop',
    },
  ]);

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      this.displayName = user.displayName;
      this.timeZone = user.timeZone ?? null;
      this.calendar = user.calendar;
      this.theme = user.theme;
      this.calendarPreference.hydrateFromUser(user);
      this.themePreference.hydrateFromUser(user);
      this.localeService.hydrateFromUser(user);
      this.timeZoneOptions = this.buildTimeZoneOptions(user.timeZone);
    } else {
      this.calendar = this.calendarPreference.calendar();
      this.theme = this.themePreference.theme();
      this.timeZoneOptions = this.buildTimeZoneOptions(null);
    }
  }

  onLocaleChange(lang: UiLang) {
    void this.localeService.setLang(lang, { persistProfile: false });
  }

  onShowTomanChange(checked: boolean) {
    this.moneyDisplay.setShowToman(checked);
  }

  onCalendarChange(value: CalendarSystem) {
    this.calendar = value;
    this.calendarPreference.setCalendar(value);
  }

  onThemeChange(value: ThemePreference) {
    this.theme = value;
    this.themePreference.setTheme(value);
  }

  saveProfile() {
    this.error.set(null);
    this.message.set(null);
    this.loading.set(true);
    const locale = this.localeService.activeLang();
    this.auth
      .updateProfile({
        displayName: this.displayName,
        locale,
        timeZone: this.timeZone || null,
        calendar: this.calendar,
        theme: this.theme,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.calendarPreference.setCalendar(this.calendar);
          this.themePreference.setTheme(this.theme);
          void this.localeService.setLang(locale, { persistProfile: false });
          this.message.set(this.i18n.translate('settings.updated'));
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.error.set(
            err.error?.message ?? this.i18n.translate('settings.updateFailed'),
          );
        },
      });
  }

  private buildTimeZoneOptions(
    current: string | null | undefined,
  ): SelectOption<string>[] {
    return ensureTimeZoneOption(listTimeZones(), current).map((zone) => ({
      label: zone,
      value: zone,
    }));
  }
}
