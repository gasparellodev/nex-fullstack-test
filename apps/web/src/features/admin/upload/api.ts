import type { ImportResultDto } from '@nex/shared';
import { api } from '@/lib/api-client';

export async function uploadSpreadsheet(file: File): Promise<ImportResultDto> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<ImportResultDto>('/admin/imports', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    maxBodyLength: Infinity,
  });
  return data;
}
