import type { AuthResponseDto } from '@nex/shared';
import { api } from '@/lib/api-client';

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  cpf: string;
  password: string;
  consent: true;
}

export async function login(body: LoginBody): Promise<AuthResponseDto> {
  const { data } = await api.post<AuthResponseDto>('/auth/login', body);
  return data;
}

export async function register(body: RegisterBody): Promise<AuthResponseDto> {
  const { data } = await api.post<AuthResponseDto>('/auth/register', body);
  return data;
}
