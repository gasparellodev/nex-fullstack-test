/**
 * Brazilian CPF (Cadastro de Pessoas Físicas) utilities.
 * Implements the canonical mod-11 check-digit algorithm and rejects
 * obvious decoy values such as `111.111.111-11`.
 */

const DIGITS_ONLY = /\D+/g;
const ALL_SAME_DIGIT = /^(\d)\1{10}$/;

export function normalizeCpf(input: string): string {
  return input.replace(DIGITS_ONLY, '');
}

export function isValidCpf(input: string): boolean {
  const cpf = normalizeCpf(input);
  if (cpf.length !== 11) return false;
  if (ALL_SAME_DIGIT.test(cpf)) return false;

  for (let length = 9; length <= 10; length++) {
    const slice = cpf.slice(0, length);
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(slice[i]) * (length + 1 - i);
    }
    const mod = (sum * 10) % 11;
    const check = mod === 10 ? 0 : mod;
    if (check !== Number(cpf[length])) return false;
  }
  return true;
}

export function maskCpf(input: string): string {
  const cpf = normalizeCpf(input);
  if (cpf.length !== 11) return '***.***.***-**';
  return `***.***.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

export function formatCpf(input: string): string {
  const cpf = normalizeCpf(input);
  if (cpf.length !== 11) return input;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}
