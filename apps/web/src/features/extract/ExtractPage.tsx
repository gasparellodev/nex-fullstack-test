import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { StatusBadge } from '@/features/admin/report/StatusBadge';
import { formatCentsToBRL, formatPoints } from '@/lib/format';
import { listMyTransactions, type UserExtractFilters } from './api';
import type { TransactionStatus } from '@nex/shared';

interface FormState {
  status: '' | TransactionStatus;
  fromDate: string;
  toDate: string;
}

const EMPTY_FORM: FormState = { status: '', fromDate: '', toDate: '' };

function toFilters(form: FormState, page: number, pageSize: number): UserExtractFilters {
  return {
    status: (form.status || undefined) as TransactionStatus | undefined,
    fromDate: form.fromDate || undefined,
    toDate: form.toDate || undefined,
    page,
    pageSize,
  };
}

export function ExtractPage(): JSX.Element {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [filters, setFilters] = useState<UserExtractFilters>({ page: 1, pageSize: 10 });

  const query = useQuery({
    queryKey: ['me', 'transactions', filters],
    queryFn: () => listMyTransactions(filters),
    placeholderData: keepPreviousData,
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function apply(): void {
    setFilters(toFilters(form, 1, filters.pageSize));
  }

  function clear(): void {
    setForm(EMPTY_FORM);
    setFilters({ page: 1, pageSize: filters.pageSize });
  }

  const data = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Status" htmlFor="status">
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => update('status', e.target.value as FormState['status'])}
              >
                <option value="">Todos</option>
                <option value="approved">Aprovado</option>
                <option value="rejected">Reprovado</option>
                <option value="pending">Em avaliação</option>
              </select>
            </FormField>
            <FormField label="De" htmlFor="fromDate">
              <Input
                id="fromDate"
                type="date"
                value={form.fromDate}
                onChange={(e) => update('fromDate', e.target.value)}
              />
            </FormField>
            <FormField label="Até" htmlFor="toDate">
              <Input
                id="toDate"
                type="date"
                value={form.toDate}
                onChange={(e) => update('toDate', e.target.value)}
              />
            </FormField>
            <div className="flex items-end gap-2">
              <Button type="button" onClick={apply}>
                Aplicar
              </Button>
              <Button type="button" variant="outline" onClick={clear}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Minhas transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Descrição</th>
                  <th className="px-3 py-2 text-right">Pontos</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {query.isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      Carregando…
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      Nenhuma transação encontrada.
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 whitespace-nowrap">{row.occurredAt}</td>
                      <td className="px-3 py-2">{row.description}</td>
                      <td className="px-3 py-2 text-right">{formatPoints(row.points)}</td>
                      <td className="px-3 py-2 text-right">{formatCentsToBRL(row.amountCents)}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {total} {total === 1 ? 'transação' : 'transações'} · página {filters.page} de{' '}
              {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page <= 1 || query.isLoading}
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page >= totalPages || query.isLoading}
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
