export const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TransactionStatus = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PENDING: 'pending',
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const AuditAction = {
  IMPORT_RUN: 'import.run',
  REPORT_VIEW: 'report.view',
  LGPD_EXPORT: 'lgpd.export',
  LGPD_DELETE: 'lgpd.delete',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
