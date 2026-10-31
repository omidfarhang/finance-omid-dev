import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  type CategoryKind,
  type PublicCategory,
} from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { TransactionsService } from '../../core/transactions.service';

@Component({
  selector: 'app-settings-categories-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonDirective,
    Dialog,
    InputText,
    Message,
    Select,
    TranslocoDirective,
  ],
  templateUrl: './settings-categories.page.html',
  styleUrl: './settings-categories.page.scss',
})
export class SettingsCategoriesPage implements OnInit {
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  categories = signal<PublicCategory[]>([]);
  categoryDialogVisible = signal(false);
  editingCategoryId: string | null = null;
  categoryName = '';
  categoryKind: CategoryKind = 'EXPENSE';

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
      this.txApi.updateCategory(this.editingCategoryId, { name }).subscribe({
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

    this.txApi.createCategory({ name, kind: this.categoryKind }).subscribe({
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
}
