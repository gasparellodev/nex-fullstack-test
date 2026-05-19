import { describe, expect, it } from 'vitest';
import { formatCpf, isValidCpf, maskCpf, normalizeCpf } from '@/shared/cpf.js';

describe('normalizeCpf', () => {
  it('strips punctuation and whitespace', () => {
    expect(normalizeCpf(' 282.279.300-00 ')).toBe('28227930000');
  });

  it('returns digits unchanged when already clean', () => {
    expect(normalizeCpf('28227930000')).toBe('28227930000');
  });
});

describe('isValidCpf', () => {
  it.each([
    ['282.279.300-00', true], // example from the assignment statement
    ['529.982.247-25', true], // canonical valid CPF
    ['529.982.247-24', false], // wrong last check digit
    ['111.111.111-11', false], // repeated digits decoy
    ['000.000.000-00', false],
    ['1234567890', false], // wrong length
    ['', false],
    ['abcdefghijk', false],
  ])('isValidCpf(%s) → %s', (input, expected) => {
    expect(isValidCpf(input)).toBe(expected);
  });
});

describe('maskCpf', () => {
  it('keeps only the last 5 digits visible', () => {
    expect(maskCpf('529.982.247-25')).toBe('***.***.247-25');
  });

  it('falls back gracefully for malformed input', () => {
    expect(maskCpf('abc')).toBe('***.***.***-**');
  });
});

describe('formatCpf', () => {
  it('formats digits-only CPF into the canonical mask', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
  });
});
