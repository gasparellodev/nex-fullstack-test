import type { TransactionStatus } from '@nex/shared';
import { cn } from '@/lib/utils';

const STYLES: Record<TransactionStatus, string> = {
  approved: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  rejected: 'bg-red-100 text-red-800 ring-red-600/20',
  pending: 'bg-amber-100 text-amber-800 ring-amber-600/20',
};

const LABELS: Record<TransactionStatus, string> = {
  approved: 'Aprovado',
  rejected: 'Reprovado',
  pending: 'Em avaliação',
};

export function StatusBadge({ status }: { status: TransactionStatus }): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
