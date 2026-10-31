import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  DEFAULT_THEME,
  type CalendarSystem,
  type ThemePreference,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
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

@Component({
  selector: 'app-settings-profile-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonDirective,
    InputText,
    Message,
    SelectButton,
    TranslocoDirective,
  ],
  templateUrl: './settings-profile.page.html',
  styleUrl: './settings-profile.page.scss',
})
export class SettingsProfilePage implements OnInit {
  displayName = '';
  timeZone = '';
  calendar: CalendarSystem = 'JALALI';
  theme: ThemePreference = DEFAULT_THEME;
  timeZones: string[] = listTimeZones();
  readonly calendarOptions: { labelKey: string; value: CalendarSystem }[] = [
    { labelKey: 'settings.calendarJalali', value: 'JALALI' },
    { labelKey: 'settings.calendarGregorian', value: 'GREGORIAN' },
  ];
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  loading = signal(false);

  readonly auth = inject(AuthService);
  readonly localeService = inject(LocaleService);
  readonly calendarPreference = inject(CalendarPreferenceService);
  readonly themePreference = inject(ThemePreferenceService);
  readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly i18n = inject(TranslocoService);

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
      this.timeZone = user.timeZone ?? '';
      this.calendar = user.calendar;
      this.theme = user.theme;
      this.calendarPreference.hydrateFromUser(user);
      this.themePreference.hydrateFromUser(user);
      this.localeService.hydrateFromUser(user);
      this.timeZones = ensureTimeZoneOption(this.timeZones, user.timeZone);
    } else {
      this.calendar = this.calendarPreference.calendar();
      this.theme = this.themePreference.theme();
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
}
