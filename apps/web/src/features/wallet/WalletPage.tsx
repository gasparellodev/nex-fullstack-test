import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPoints } from '@/lib/format';
import { fetchWallet } from '@/features/extract/api';

export function WalletPage(): JSX.Element {
  const query = useQuery({
    queryKey: ['me', 'wallet'],
    queryFn: fetchWallet,
  });

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Saldo de pontos</CardTitle>
          <CardDescription>
            Somatório de todas as transações com status <strong>Aprovado</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {query.isError ? (
            <Alert variant="destructive">
              <AlertDescription>Não foi possível obter o saldo agora.</AlertDescription>
            </Alert>
          ) : (
            <p className="text-5xl font-semibold tracking-tight">
              {query.isLoading ? '—' : formatPoints(query.data?.balancePoints ?? 0)}
              <span className="ml-2 text-lg font-normal text-muted-foreground">pts</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como o saldo é calculado</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Transações com status <strong>Reprovado</strong> ou <strong>Em avaliação</strong>{' '}
          não entram no saldo. Quando uma transação que estava{' '}
          <em>em avaliação</em> for aprovada pelo administrador, o valor passa a contar
          automaticamente.
        </CardContent>
      </Card>
    </section>
  );
}
