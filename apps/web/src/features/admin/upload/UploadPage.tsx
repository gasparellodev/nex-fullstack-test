import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApiError } from '@/lib/api-client';
import type { ImportResultDto } from '@nex/shared';
import { uploadSpreadsheet } from './api';

const ACCEPTED = '.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

export function UploadPage(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResultDto | null>(null);

  const mutation = useMutation({
    mutationFn: (selected: File) => uploadSpreadsheet(selected),
    onSuccess: (data) => {
      setResult(data);
      toast.success(
        data.importedRows === 0
          ? 'Arquivo já havia sido importado anteriormente.'
          : `Importação concluída: ${data.importedRows} de ${data.totalRows} linhas.`,
      );
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Falha desconhecida.';
      toast.error(`Falha na importação: ${message}`);
    },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!file) return;
    setResult(null);
    mutation.mutate(file);
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Importar planilha</CardTitle>
          <CardDescription>
            Envie um arquivo <code>.xlsx</code> ou <code>.csv</code> contendo as transações.
            Linhas com CPFs não cadastrados serão informadas no relatório de importação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <label
              htmlFor="file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-muted/30 p-10 text-center transition hover:bg-muted/50"
            >
              <span className="font-medium">
                {file ? file.name : 'Clique para selecionar o arquivo'}
              </span>
              <span className="text-sm text-muted-foreground">
                Aceita .xlsx e .csv · até 5 MB · 50 000 linhas
              </span>
              <input
                id="file"
                type="file"
                accept={ACCEPTED}
                className="sr-only"
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null;
                  setFile(selected);
                  setResult(null);
                }}
              />
            </label>
            <Button type="submit" disabled={!file || mutation.isPending}>
              {mutation.isPending ? 'Importando…' : 'Importar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card aria-live="polite">
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
          <CardDescription>
            Resumo da última importação realizada nesta sessão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!result ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma importação realizada ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              <div className="grid grid-cols-3 gap-2 rounded-md border p-3 text-center">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">total</div>
                  <div className="text-lg font-semibold">{result.totalRows}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">importadas</div>
                  <div className="text-lg font-semibold text-emerald-600">
                    {result.importedRows}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">ignoradas</div>
                  <div className="text-lg font-semibold text-amber-600">
                    {result.skippedRows.length}
                  </div>
                </div>
              </div>
              {result.skippedRows.length > 0 ? (
                <Alert>
                  <AlertTitle>Linhas ignoradas</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-y-auto pl-5">
                      {result.skippedRows.map((row) => (
                        <li key={`${row.row}-${row.reason}`}>
                          Linha <strong>{row.row}</strong> · {row.cpfMasked} ·{' '}
                          <code>{row.reason}</code>
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
