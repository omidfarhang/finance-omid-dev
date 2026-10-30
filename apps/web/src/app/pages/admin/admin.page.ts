import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { AdminUser } from '@finance/shared';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Message } from 'primeng/message';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../core/admin.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [RouterLink, ButtonDirective, Message, TranslocoDirective],
  templateUrl: './admin.page.html',
  styleUrl: './admin.page.scss',
})
export class AdminPage implements OnInit {
  users = signal<AdminUser[]>([]);
  registrationOpen = signal(true);
  loading = signal(false);
  message = signal<string | null>(null);
  error = signal<string | null>(null);

  private readonly adminApi = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(TranslocoService);
  private readonly confirm = inject(ConfirmationService);

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      settings: this.adminApi.getSettings(),
      users: this.adminApi.listUsers(),
    }).subscribe({
      next: ({ settings, users }) => {
        this.registrationOpen.set(settings.registrationOpen);
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(
          err.error?.message ?? this.i18n.translate('admin.loadFailed'),
        );
      },
    });
  }

  toggleRegistration() {
    this.error.set(null);
    this.message.set(null);
    const next = !this.registrationOpen();
    this.adminApi.updateSettings({ registrationOpen: next }).subscribe({
      next: (settings) => {
        this.registrationOpen.set(settings.registrationOpen);
        this.message.set(
          settings.registrationOpen
            ? this.i18n.translate('admin.registrationOpened')
            : this.i18n.translate('admin.registrationClosed'),
        );
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('admin.settingsFailed'),
        );
      },
    });
  }

  setRole(user: AdminUser, role: 'USER' | 'ADMIN') {
    this.patchUser(user.id, { role });
  }

  setDisabled(user: AdminUser, disabled: boolean) {
    this.patchUser(user.id, { disabled });
  }

  deleteUser(user: AdminUser) {
    this.confirm.confirm({
      message: this.i18n.translate('admin.confirmDelete', { email: user.email }),
      header: this.i18n.translate('admin.delete'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.error.set(null);
        this.message.set(null);
        this.adminApi.deleteUser(user.id).subscribe({
          next: () => {
            this.message.set(this.i18n.translate('admin.userDeleted'));
            this.reload();
          },
          error: (err: { error?: { message?: string } }) => {
            this.error.set(
              err.error?.message ?? this.i18n.translate('admin.deleteFailed'),
            );
          },
        });
      },
    });
  }

  isSelf(user: AdminUser): boolean {
    return user.id === this.auth.user()?.id;
  }

  private patchUser(
    userId: string,
    payload: { role?: 'USER' | 'ADMIN'; disabled?: boolean },
  ) {
    this.error.set(null);
    this.message.set(null);
    this.adminApi.updateUser(userId, payload).subscribe({
      next: (user) => {
        this.users.update((list) =>
          list.map((item) => (item.id === user.id ? user : item)),
        );
        this.message.set(this.i18n.translate('admin.userUpdated'));
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(
          err.error?.message ?? this.i18n.translate('admin.updateFailed'),
        );
      },
    });
  }
}
