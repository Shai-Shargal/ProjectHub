import { Routes } from '@angular/router';

import { LoginComponent } from './features/auth/components/login/login.component';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { InfoComponent } from './features/info/components/info/info.component';
import { authGuard } from './core/guards/auth.guard';
import { ROUTE_PATHS } from './shared/constants/routes';

export const routes: Routes = [
  { path: '', redirectTo: ROUTE_PATHS.LOGIN, pathMatch: 'full' },
  { path: ROUTE_PATHS.LOGIN, component: LoginComponent },
  { path: ROUTE_PATHS.REGISTER, component: RegisterComponent },
  { path: ROUTE_PATHS.INFO, component: InfoComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: ROUTE_PATHS.LOGIN }
];

