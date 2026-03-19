import { Validators } from '@angular/forms';

export const PASSWORD_PATTERN = /^(?=.*\d)(?=.*[A-Z]).{8,}$/;
export const passwordValidators = [Validators.required, Validators.pattern(PASSWORD_PATTERN)];

