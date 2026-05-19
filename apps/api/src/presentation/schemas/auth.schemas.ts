import { z } from 'zod';

export const RegisterBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  cpf: z.string().min(11).max(20),
  password: z.string().min(8).max(128),
  consent: z.literal(true, { errorMap: () => ({ message: 'consent must be true' }) }),
});

export const LoginBodySchema = z.object({
  email: z.string().trim().email().max(180),
  password: z.string().min(1).max(128),
});

export type RegisterBody = z.infer<typeof RegisterBodySchema>;
export type LoginBody = z.infer<typeof LoginBodySchema>;
