import { api } from '@/lib/api-client';

export interface ExportPayload {
  exportedAt: string;
  user: Record<string, unknown>;
  transactions: unknown[];
}

export async function exportMyData(): Promise<ExportPayload> {
  const { data } = await api.post<ExportPayload>('/me/export');
  return data;
}

export async function deleteMyAccount(): Promise<{ anonymisedEmail: string }> {
  const { data } = await api.delete<{ anonymisedEmail: string }>('/me');
  return data;
}
