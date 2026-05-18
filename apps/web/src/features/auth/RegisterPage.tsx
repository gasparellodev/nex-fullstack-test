import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApiError } from '@/lib/api-client';
import { maskCpfInput, onlyDigits } from '@/lib/format';
import { RegisterSchema, type RegisterInput } from './schemas';
import { register as apiRegister } from './api';
import { useAuthStore } from '@/stores/auth.store';
import { homeForRole } from '@/app/routes';

export function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      cpf: '',
      password: '',
      passwordConfirmation: '',
      consent: false,
    },
  });

  const cpfValue = watch('cpf');

  async function onSubmit(input: RegisterInput): Promise<void> {
    setSubmitError(null);
    try {
      const result = await apiRegister({
        name: input.name,
        email: input.email,
        cpf: onlyDigits(input.cpf),
        password: input.password,
        consent: true,
      });
      setSession(result);
      navigate(homeForRole(result.user.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(
          err.code === 'conflict'
            ? 'E-mail ou CPF já cadastrados.'
            : err.code === 'validation_failed'
              ? 'Confira os dados informados.'
              : err.message,
        );
        return;
      }
      setSubmitError('Não foi possível concluir o cadastro. Tente novamente.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            Cadastre-se para visualizar suas transações e o saldo da carteira.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {submitError ? (
              <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}
            <FormField label="Nome completo" htmlFor="name" error={errors.name?.message}>
              <Input id="name" autoComplete="name" autoFocus {...register('name')} />
            </FormField>
            <FormField label="E-mail" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
            </FormField>
            <FormField label="CPF" htmlFor="cpf" error={errors.cpf?.message}>
              <Input
                id="cpf"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={cpfValue}
                onChange={(e) => setValue('cpf', maskCpfInput(e.target.value), { shouldValidate: true })}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Senha" htmlFor="password" error={errors.password?.message}>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                />
              </FormField>
              <FormField
                label="Confirme a senha"
                htmlFor="passwordConfirmation"
                error={errors.passwordConfirmation?.message}
              >
                <Input
                  id="passwordConfirmation"
                  type="password"
                  autoComplete="new-password"
                  {...register('passwordConfirmation')}
                />
              </FormField>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox id="consent" {...register('consent')} />
              <label htmlFor="consent" className="text-sm text-muted-foreground">
                Li e aceito o tratamento dos meus dados pessoais conforme a LGPD
                para a finalidade exclusiva deste serviço.
              </label>
            </div>
            {errors.consent ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.consent.message}
              </p>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando…' : 'Criar conta'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                Entrar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
