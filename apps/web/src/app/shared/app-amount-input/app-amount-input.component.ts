import {
  Component,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { LocaleService } from '../../core/i18n/locale.service';
import {
  caretIndexAfterDigits,
  countAmountDigits,
  formatAmountInputDigits,
  parseAmountInputValue,
} from '../../core/money-amount-input';

@Component({
  selector: 'app-amount-input',
  standalone: true,
  imports: [InputText],
  templateUrl: './app-amount-input.component.html',
  styleUrl: './app-amount-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppAmountInputComponent),
      multi: true,
    },
  ],
})
export class AppAmountInputComponent implements ControlValueAccessor {
  private readonly locale = inject(LocaleService);

  /** HTML `name` for the inner input. */
  readonly name = input<string | undefined>(undefined);
  /** Allow a leading minus (initial / checkpoint balances). */
  readonly allowNegative = input(false);
  readonly required = input(false);

  private readonly digits = signal('');
  readonly display = computed(() =>
    formatAmountInputDigits(this.digits(), this.locale.activeLang()),
  );

  disabled = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.digits.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const caret = el.selectionStart ?? el.value.length;
    const digitsBefore = countAmountDigits(el.value.slice(0, caret));
    const parsed = parseAmountInputValue(el.value, this.allowNegative());
    const formatted = formatAmountInputDigits(
      parsed,
      this.locale.activeLang(),
    );
    this.digits.set(parsed);
    this.onChange(parsed);
    // Apply formatted text before CD so the caret stays with the edited digit.
    el.value = formatted;
    const nextCaret = caretIndexAfterDigits(formatted, digitsBefore);
    el.setSelectionRange(nextCaret, nextCaret);
  }

  onBlur(): void {
    this.onTouched();
  }
}
