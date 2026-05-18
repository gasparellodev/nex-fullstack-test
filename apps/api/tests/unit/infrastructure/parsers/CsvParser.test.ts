import { describe, expect, it } from 'vitest';
import { CsvParser } from '@/infrastructure/parsers/CsvParser.js';

const HEADER = 'CPF,Descrição da transação,Data da transação,Valor em pontos,Valor,Status';

describe('CsvParser', () => {
  const parser = new CsvParser();

  it('parses the assignment example', () => {
    const csv = `${HEADER}
282.279.300-00,Venda do produto X,10-10-2022,"10,000","10.000,00",Aprovado
282.279.300-00,Venda do produto Y,10-10-2022,"10,000","10.000,00",Reprovado
282.279.300-00,Venda do produto Z,10-10-2022,"10,000","10.000,00",Em avaliação
`;
    const result = parser.parse(Buffer.from(csv));
    expect(result.totalRows).toBe(3);
    expect(result.rows.map((r) => r.status)).toEqual(['approved', 'rejected', 'pending']);
    expect(result.skipped).toEqual([]);
  });

  it('reports skipped rows with their original index', () => {
    const csv = `${HEADER}
282.279.300-00,Venda,10-10-2022,"10,000","10.000,00",Aprovado
111.111.111-11,Venda,10-10-2022,"10,000","10.000,00",Aprovado
`;
    const result = parser.parse(Buffer.from(csv));
    expect(result.rows).toHaveLength(1);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]).toMatchObject({ rowIndex: 3, reason: 'invalid_cpf' });
  });

  it('supports semicolon delimiters', () => {
    const csv = `CPF;Descrição da transação;Data da transação;Valor em pontos;Valor;Status
282.279.300-00;Venda;10-10-2022;10000;10000,00;Aprovado
`;
    const result = parser.parse(Buffer.from(csv));
    expect(result.rows).toHaveLength(1);
  });

  it('rejects files missing required columns', () => {
    const csv = `CPF,Descrição,Status\n282.279.300-00,Venda,Aprovado\n`;
    expect(() => parser.parse(Buffer.from(csv))).toThrow(/missing required column/);
  });
});
