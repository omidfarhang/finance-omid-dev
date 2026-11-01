import {
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  CategoryKind,
  CreateRecurringDto,
  MonthAnchor,
  PublicAccount,
  PublicCategory,
  RecurringInterval,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonDirective } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import {
  categoryColorCssVar,
  categoryOptionFrom,
  defaultCategoryId,
} from '../../core/category-display';
import { LocaleService } from '../../core/i18n/locale.service';
import { minorUnitLabel } from '../../core/money-display';
import { RecurringsService } from '../../core/recurrings.service';
import { TransactionsService } from '../../core/transactions.service';
import { AppAmountInputComponent } from '../app-amount-input/app-amount-input.component';
import { AppDateTimeFieldComponent } from '../app-date-time-field/app-date-time-field.component';
import { RecurringScheduleFieldsComponent } from '../recurring-schedule-fields/recurring-schedule-fields.component';

export type AddMovementType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type AddMovementSavedEvent = {
  type: AddMovementType;
  /** Set when the ledger entry succeeded but creating the recurring rule failed. */
  recurringWarning?: string;
};

type TypeOption = {
  label: string;
  value: AddMovementType;
  icon: string;
};

@Component({
  selector: 'app-add-movement-dialog',
  standalone: true,
  imports: [
    AppAmountInputComponent,
    AppDateTimeFieldComponent,
    RecurringScheduleFieldsComponent,
    FormsModule,
    ButtonDirective,
    Checkbox,
    Dialog,
    InputText,
    Message,
    Select,
    SelectButton,
    TranslocoDirective,
  ],
  templateUrl: './add-movement-dialog.component.html',
  styleUrl: './add-movement-dialog.component.scss',
})
export class AddMovementDialogComponent {
  readonly visible = model(false);
  readonly accounts = input.required<PublicAccount[]>();
  readonly categories = input.required<PublicCategory[]>();
  readonly initialType = input<AddMovementType>('EXPENSE');
  readonly defaultAccountId = input<string | null>(null);

  readonly saved = output<AddMovementSavedEvent>();

  selectedType: AddMovementType = 'EXPENSE';
  movementAccountId = '';
  movementAmount = '';
  movementOccurredAt = '';
  movementDescription = '';
  movementCategoryId = '';
  movementShared = false;
  transferFromId = '';
  transferToId = '';
  transferAmount = '';
  transferOccurredAt = '';
  transferDescription = '';
  transferCategoryId = '';
  alsoRecurring = false;
  recurringInterval: RecurringInterval = 'MONTHLY';
  recurringMonthAnchor: MonthAnchor = 'DAY';
  recurringAnchorDay = 1;
  recurringAnchorMonth = 1;
  recurringWeekday = 0;
  formError = signal<string | null>(null);
  saving = signal(false);

  readonly typeOptions = computed((): TypeOption[] => [
    {
      label: this.i18n.translate('activity.type.INCOME'),
      value: 'INCOME',
      icon: 'pi pi-arrow-down',
    },
    {
      label: this.i18n.translate('activity.type.EXPENSE'),
      value: 'EXPENSE',
      icon: 'pi pi-arrow-up',
    },
    {
      label: this.i18n.translate('activity.type.TRANSFER'),
      value: 'TRANSFER',
      icon: 'pi pi-arrows-h',
    },
  ]);

  readonly accountOptions = computed(() =>
    this.accounts().map((a) => ({
      label: `${a.name} (${a.currency})`,
      value: a.id,
    })),
  );

  private readonly txApi = inject(TransactionsService);
  private readonly recurringsApi = inject(RecurringsService);
  private readonly i18n = inject(TranslocoService);
  private readonly locale = inject(LocaleService);

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.resetForm();
      }
    });
  }

  onTypeChange(type: AddMovementType) {
    this.selectedType = type;
    if (type === 'INCOME' || type === 'EXPENSE') {
      this.movementCategoryId = defaultCategoryId(this.categories(), type);
      this.movementShared = false;
    } else {
      this.transferCategoryId = defaultCategoryId(this.categories(), 'TRANSFER');
    }
  }

  categoryOptionsFor(kind: CategoryKind) {
    return this.categories()
      .filter((c) => c.kind === kind)
      .map((c) => categoryOptionFrom(c, this.i18n));
  }

  colorVar(color: string): string | null {
    return categoryColorCssVar(color);
  }

  selectedMovementAccount(): PublicAccount | undefined {
    return this.accounts().find((a) => a.id === this.movementAccountId);
  }

  unitLabel(currency: string): string {
    return minorUnitLabel(
      currency,
      {
        rials: this.i18n.translate('accounts.rials'),
        cents: this.i18n.translate('accounts.cents'),
      },
      this.locale.activeLang(),
    );
  }

  submit() {
    if (this.selectedType === 'TRANSFER') {
      this.saveTransfer();
      return;
    }
    this.saveMovement();
  }

  private saveMovement() {
    this.formError.set(null);
    if (
      !this.movementAccountId ||
      !this.movementCategoryId ||
      !/^\d+$/.test(this.movementAmount.trim())
    ) {
      this.formError.set(
        !this.movementCategoryId
          ? this.i18n.translate('activity.categoryRequired')
          : this.i18n.translate('activity.invalidAmount'),
      );
      return;
    }
    const account = this.selectedMovementAccount();
    const shared =
      this.selectedType === 'EXPENSE' &&
      !!account &&
      !account.isShared &&
      this.movementShared;
    const type = this.selectedType;
    if (type === 'TRANSFER') {
      return;
    }
    this.saving.set(true);
    this.txApi
      .createTransaction({
        type,
        accountId: this.movementAccountId,
        amountMinor: this.movementAmount.trim(),
        occurredAt: new Date(this.movementOccurredAt).toISOString(),
        description: this.movementDescription.trim() || null,
        categoryId: this.movementCategoryId,
        shared,
      })
      .subscribe({
        next: () => {
          this.afterMovementSaved(type, {
            type,
            amountMinor: this.movementAmount.trim(),
            currency: account?.currency ?? 'IRR',
            categoryId: this.movementCategoryId,
            description: this.movementDescription.trim() || null,
            fromAccountId: null,
            toAccountId: null,
          });
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving.set(false);
          this.formError.set(
            err.error?.message ?? this.i18n.translate('activity.createFailed'),
          );
        },
      });
  }

  private saveTransfer() {
    this.formError.set(null);
    if (
      !this.transferFromId ||
      !this.transferToId ||
      !this.transferCategoryId ||
      !/^\d+$/.test(this.transferAmount.trim())
    ) {
      this.formError.set(
        !this.transferCategoryId
          ? this.i18n.translate('activity.categoryRequired')
          : this.i18n.translate('activity.invalidAmount'),
      );
      return;
    }
    const from = this.accounts().find((a) => a.id === this.transferFromId);
    this.saving.set(true);
    this.txApi
      .createTransaction({
        type: 'TRANSFER',
        accountId: this.transferFromId,
        counterAccountId: this.transferToId,
        amountMinor: this.transferAmount.trim(),
        occurredAt: new Date(this.transferOccurredAt).toISOString(),
        description: this.transferDescription.trim() || null,
        categoryId: this.transferCategoryId,
      })
      .subscribe({
        next: () => {
          this.afterMovementSaved('TRANSFER', {
            type: 'TRANSFER',
            amountMinor: this.transferAmount.trim(),
            currency: from?.currency ?? 'IRR',
            categoryId: this.transferCategoryId,
            description: this.transferDescription.trim() || null,
            fromAccountId: this.transferFromId,
            toAccountId: this.transferToId,
          });
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving.set(false);
          this.formError.set(
            err.error?.message ?? this.i18n.translate('activity.createFailed'),
          );
        },
      });
  }

  private afterMovementSaved(
    type: AddMovementType,
    draft: {
      type: AddMovementType;
      amountMinor: string;
      currency: string;
      categoryId: string;
      description: string | null;
      fromAccountId: string | null;
      toAccountId: string | null;
    },
  ) {
    if (!this.alsoRecurring) {
      this.saving.set(false);
      this.visible.set(false);
      this.saved.emit({ type });
      return;
    }

    const payload: CreateRecurringDto = {
      type: draft.type,
      amountMinor: draft.amountMinor,
      currency: draft.currency,
      categoryId: draft.categoryId || null,
      description: draft.description,
      interval: this.recurringInterval,
      monthAnchor: this.recurringMonthAnchor,
      anchorDay:
        (this.recurringInterval === 'MONTHLY' ||
          this.recurringInterval === 'YEARLY') &&
        this.recurringMonthAnchor === 'DAY'
          ? this.recurringAnchorDay
          : null,
      anchorMonth:
        this.recurringInterval === 'YEARLY' ? this.recurringAnchorMonth : null,
      weekday:
        this.recurringInterval === 'WEEKLY' ? this.recurringWeekday : null,
      fromAccountId: draft.fromAccountId,
      toAccountId: draft.toAccountId,
      active: true,
    };

    this.recurringsApi.create(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.visible.set(false);
        this.saved.emit({ type });
      },
      error: (err: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.visible.set(false);
        this.saved.emit({
          type,
          recurringWarning:
            err.error?.message ??
            this.i18n.translate('outlook.recurringAfterSaveFailed'),
        });
      },
    });
  }

  private resetForm() {
    const accounts = this.accounts();
    const preferredId =
      this.defaultAccountId() &&
      accounts.some((a) => a.id === this.defaultAccountId())
        ? this.defaultAccountId()!
        : (accounts[0]?.id ?? '');
    const other =
      accounts.find((a) => a.id !== preferredId)?.id ?? accounts[1]?.id ?? '';

    this.selectedType = this.initialType();
    this.movementAccountId = preferredId;
    this.movementAmount = '';
    this.movementOccurredAt = new Date().toISOString();
    this.movementDescription = '';
    this.movementCategoryId =
      this.selectedType === 'TRANSFER'
        ? ''
        : defaultCategoryId(this.categories(), this.selectedType);
    this.movementShared = false;
    this.transferFromId = preferredId;
    this.transferToId = other;
    this.transferAmount = '';
    this.transferOccurredAt = new Date().toISOString();
    this.transferDescription = '';
    this.transferCategoryId = defaultCategoryId(this.categories(), 'TRANSFER');
    this.alsoRecurring = false;
    this.recurringInterval = 'MONTHLY';
    this.recurringMonthAnchor = 'DAY';
    this.recurringAnchorDay = 1;
    this.recurringAnchorMonth = 1;
    this.recurringWeekday = 0;
    this.formError.set(null);
    this.saving.set(false);
  }
}
