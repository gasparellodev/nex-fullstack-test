import { describe, expect, it } from 'vitest';
import {
  formatCentsToBRL,
  formatPoints,
  isValidCpf,
  maskCpfInput,
  onlyDigits,
} from './format';

describe('onlyDigits', () => {
  it('strips everything but digits', () => {
    expect(onlyDigits(' 282.279.300-00 ')).toBe('28227930000');
  });
});

describe('maskCpfInput', () => {
  it.each([
    ['1', '1'],
    ['123', '123'],
    ['1234', '123.4'],
    ['12345678', '123.456.78'],
    ['123456789', '123.456.789'],
    ['1234567890', '123.456.789-0'],
    ['12345678901', '123.456.789-01'],
    ['282.279.300-00', '282.279.300-00'],
    ['282279300001234', '282.279.300-00'], // overflow trimmed to 11 digits
  ])('maskCpfInput(%s) → %s', (input, expected) => {
    expect(maskCpfInput(input)).toBe(expected);
  });
});

describe('isValidCpf', () => {
  it('accepts 282.279.300-00 (assignment example)', () => {
    expect(isValidCpf('282.279.300-00')).toBe(true);
  });

  it('rejects repeated digits', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });
});

describe('formatCentsToBRL', () => {
  it('formats according to pt-BR locale', () => {
    const formatted = formatCentsToBRL(1000000);
    // Different ICU versions render the non-breaking space differently;
    // matching by digits keeps the test robust.
    expect(formatted.replace(/\s/g, '')).toBe('R$10.000,00');
  });
});

describe('formatPoints', () => {
  it('uses pt-BR grouping', () => {
    expect(formatPoints(10000)).toBe('10.000');
  });
});
