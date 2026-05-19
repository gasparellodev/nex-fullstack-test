import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApiError } from '@/lib/api-client';
import { LoginSchema, type LoginInput } from './schemas';
import { login } from './api';
import { useAuthStore } from '@/stores/auth.store';
import { homeForRole } from '@/app/routes';

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(input: LoginInput): Promise<void> {
    setSubmitError(null);
    try {
      const result = await login(input);
      setSession(result);
      navigate(homeForRole(result.user.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(
          err.code === 'unauthorized' ? 'E-mail ou senha incorretos.' : err.message,
        );
        return;
      }
      setSubmitError('Não foi possível entrar. Tente novamente em instantes.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>
            Use suas credenciais para acessar sua conta na Nex Digital.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {submitError ? (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível entrar</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}
            <FormField label="E-mail" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                {...register('email')}
              />
            </FormField>
            <FormField label="Senha" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
            </FormField>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{' '}
              <Link to="/register" className="text-primary underline-offset-4 hover:underline">
                Cadastre-se
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
