import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuthStore, useCurrentUser } from '@/stores/auth.store';
import { routes } from '@/app/routes';
import { deleteMyAccount, exportMyData } from './api';

export function AccountPage(): JSX.Element {
  const user = useCurrentUser();
  const clearSession = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  const exportMutation = useMutation({
    mutationFn: exportMyData,
    onSuccess: (payload) => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nex-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Arquivo de exportação baixado.');
    },
    onError: () => toast.error('Falha ao exportar dados.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess: () => {
      clearSession();
      toast.success('Conta excluída. Você foi desconectado.');
      navigate(routes.login, { replace: true });
    },
    onError: () => toast.error('Não foi possível excluir a conta agora.'),
  });

  return (
    <section className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Minha conta</CardTitle>
          <CardDescription>
            {user ? (
              <>
                Conectado como <strong>{user.email}</strong>.
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportar meus dados (LGPD)</CardTitle>
          <CardDescription>
            Baixe um arquivo JSON com todas as informações pessoais que mantemos sobre você
            e o histórico de transações associadas à sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? 'Preparando…' : 'Exportar dados'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Excluir minha conta</CardTitle>
          <CardDescription>
            Ao excluir a conta seu e-mail é anonimizado e seu CPF é apagado do banco.
            Esta ação é irreversível.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!confirming ? (
            <Button variant="destructive" onClick={() => setConfirming(true)}>
              Quero excluir
            </Button>
          ) : (
            <Alert variant="destructive">
              <AlertTitle>Tem certeza?</AlertTitle>
              <AlertDescription>
                Esta ação não pode ser desfeita. Você será desconectado em seguida.
              </AlertDescription>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Excluindo…' : 'Sim, excluir definitivamente'}
                </Button>
                <Button variant="outline" onClick={() => setConfirming(false)}>
                  Cancelar
                </Button>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
