import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type {
  CalendarSystem,
  CategoryKind,
  PublicCategory,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { AuthService } from '../../core/auth.service';
import { CalendarPreferenceService } from '../../core/calendar-preference.service';
import { LocaleService } from '../../core/i18n/locale.service';
import { UiLang, toUiLang } from '../../core/i18n/supported-langs';
import {
  ensureTimeZoneOption,
  listTimeZones,
} from '../../core/i18n/time-zones';
import { MoneyDisplayPreferenceService } from '../../core/money-display-preference.service';
import { TransactionsService } from '../../core/transactions.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ButtonDirective,
    Dialog,
    InputText,
    Message,
    Select,
    TranslocoDirective,
  ],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage implements OnInit {
  displayName = '';
  timeZone = '';
  calendar: CalendarSystem = 'JALALI';
  totpCode = '';
  disableCode = '';
  timeZones: string[] = listTimeZones();
  readonly calendarOptions: { labelKey: string; value: CalendarSystem }[] = [
    { labelKey: 'settings.calendarJalali', value: 'JALALI' },
    { labelKey: 'settings.calendarGregorian', value: 'GREGORIAN' },
  ];
  qrDataUrl = signal<string | null>(null);
  totpSecret = signal<string | null>(null);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  loading = signal(false);
  categories = signal<PublicCategory[]>([]);
  categoryDialogVisible = signal(false);
  editingCategoryId: string | null = null;
  categoryName = '';
  categoryKind: CategoryKind = 'EXPENSE';

  readonly auth = inject(AuthService);
  readonly localeService = inject(LocaleService);
  readonly calendarPreference = inject(CalendarPreferenceService);
  readonly moneyDisplay = inject(MoneyDisplayPreferenceService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslocoService);
  private readonly txApi = inject(TransactionsService);
  private readonly confirm = inject(ConfirmationService);

  readonly kindOptions = computed(() => [
    {
      label: this.i18n.translate('settings.categories.income'),
      value: 'INCOME' as const,
    },
    {
      label: this.i18n.translate('settings.categories.expense'),
      value: 'EXPENSE' as const,
    },
  ]);

  readonly incomeCategories = computed(() =>
    this.categories().filter((c) => c.kind === 'INCOME'),
  );

  readonly expenseCategories = computed(() =>
    this.categories().filter((c) => c.kind === 'EXPENSE'),
  );

  ngOnInit() {
    const user = this.auth.user();
    if (user) {
      this.displayName = user.displayName;
      this.timeZone = user.timeZone ?? '';
      this.calendar = user.calendar;
      this.calendarPreference.hydrateFromUser(user);
      this.timeZones = ensureTimeZoneOption(this.timeZones, user.timeZone);
      const fromProfile = toUiLang(user.locale);
      if (fromProfile && fromProfile !== this.localeService.activeLang()) {
        void this.localeService.setLang(fromProfile, { persistProfile: false });
      }
    } else {
      this.calendar = this.calendarPreference.calendar();
    }
    this.reloadCategories();
  }

  reloadCategories() {
    this.txApi.listCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ??
            this.i18n.translate('settings.categories.loadFailed'),
        );
      },
    });
  }

  categoryLabel(category: PublicCategory): string {
    if (category.name === 'Uncategorized') {
      return this.i18n.translate('activity.uncategorized');
    }
    return category.name;
  }

  openCreateCategory(kind: CategoryKind) {
    this.editingCategoryId = null;
    this.categoryKind = kind;
    this.categoryName = '';
    this.categoryDialogVisible.set(true);
  }

  openEditCategory(category: PublicCategory) {
    if (category.isSystem) {
      return;
    }
    this.editingCategoryId = category.id;
    this.categoryKind = category.kind;
    this.categoryName = category.name;
    this.categoryDialogVisible.set(true);
  }

  saveCategory() {
    const name = this.categoryName.trim();
    if (!name) {
      this.error.set(this.i18n.translate('settings.categories.nameRequired'));
      return;
    }
    this.error.set(null);
    this.message.set(null);

    if (this.editingCategoryId) {
      this.txApi
        .updateCategory(this.editingCategoryId, { name })
        .subscribe({
          next: () => {
            this.message.set(this.i18n.translate('settings.categories.saved'));
            this.categoryDialogVisible.set(false);
            this.reloadCategories();
          },
          error: (err: { error?: { message?: string } }) => {
            this.error.set(
              err.error?.message ??
                this.i18n.translate('settings.categories.saveFailed'),
            );
          },
        });
      return;
    }

    this.txApi
      .createCategory({ name, kind: this.categoryKind })
      .subscribe({
        next: () => {
          this.message.set(this.i18n.translate('settings.categories.saved'));
          this.categoryDialogVisible.set(false);
          this.reloadCategories();
        },
        error: (err: { error?: { message?: string } }) => {
          this.error.set(
            err.error?.message ??
              this.i18n.translate('settings.categories.saveFailed'),
          );
        },
      });
  }

  confirmDeleteCategory(category: PublicCategory) {
    if (category.isSystem) {
      return;
    }
    this.confirm.confirm({
      message: this.i18n.translate('settings.categories.confirmDelete', {
        name: this.categoryLabel(category),
      }),
      header: this.i18n.translate('settings.categories.delete'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.error.set(null);
        this.message.set(null);
        this.txApi.deleteCategory(category.id).subscribe({
          next: () => {
            this.message.set(
              this.i18n.translate('settings.categories.deleted'),
            );
            this.reloadCategories();
          },
          error: (err: { error?: { message?: string } }) => {
            this.error.set(
              err.error?.message ??
                this.i18n.translate('settings.categories.deleteFailed'),
            );
          },
        });
      },
    });
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
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.calendarPreference.setCalendar(this.calendar);
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

  start2fa() {
    this.error.set(null);
    this.auth.setup2fa().subscribe({
      next: (res) => {
        this.qrDataUrl.set(res.qrDataUrl);
        this.totpSecret.set(res.secret);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('settings.totp.setupFailed'),
        );
      },
    });
  }

  confirm2fa() {
    this.error.set(null);
    this.auth.confirm2fa(this.totpCode).subscribe({
      next: () => {
        this.message.set(this.i18n.translate('settings.totp.enabledMessage'));
        this.qrDataUrl.set(null);
        this.totpSecret.set(null);
        this.totpCode = '';
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('settings.totp.invalidCode'),
        );
      },
    });
  }

  disable2fa() {
    this.error.set(null);
    this.auth.disable2fa(this.disableCode).subscribe({
      next: () => {
        this.message.set(this.i18n.translate('settings.totp.disabledMessage'));
        this.disableCode = '';
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ??
            this.i18n.translate('settings.totp.disableFailed'),
        );
      },
    });
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
    });
  }
}
