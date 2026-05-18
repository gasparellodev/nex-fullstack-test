import type { UserRole } from '@nex/shared';

export const routes = {
  login: '/login',
  register: '/register',
  home: '/',
  extract: '/extrato',
  wallet: '/carteira',
  account: '/conta',
  adminUpload: '/admin/upload',
  adminReport: '/admin/relatorio',
} as const;

export function homeForRole(role: UserRole): string {
  return role === 'admin' ? routes.adminUpload : routes.extract;
}
