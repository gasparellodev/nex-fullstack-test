import { z } from 'zod';
import { isValidCpf, onlyDigits } from '@/lib/format';

export const LoginSchema = z.object({
  email: z.string().trim().email('e-mail inválido'),
  password: z.string().min(1, 'informe sua senha'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, 'mínimo 2 caracteres').max(120),
    email: z.string().trim().email('e-mail inválido').max(180),
    cpf: z
      .string()
      .transform(onlyDigits)
      .refine((v) => v.length === 11, 'CPF deve ter 11 dígitos')
      .refine(isValidCpf, 'CPF inválido'),
    password: z
      .string()
      .min(8, 'senha deve ter ao menos 8 caracteres')
      .max(128, 'senha muito longa'),
    passwordConfirmation: z.string(),
    consent: z.boolean(),
  })
  .refine((d) => d.password === d.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'senhas não conferem',
  })
  .refine((d) => d.consent === true, {
    path: ['consent'],
    message: 'é necessário aceitar os termos para criar a conta',
  });
export type RegisterInput = z.infer<typeof RegisterSchema>;
