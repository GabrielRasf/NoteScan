import { periodLabel } from '../services/chart/period';
import { summarizeExpenses } from '../services/chart/summarize';
import { draftFromRecognition, validateExpenseDraft } from '../services/expenses/expense';
import { formatBrl, parseAmountInput } from '../services/expenses/money';
import { parseReceiptText } from '../services/expenses/parseReceiptText';

describe('leitura simples da nota', () => {
  test('preenche só o que o texto contém', () => {
    expect(parseReceiptText('MERCADO\n10/03/2026\nTOTAL R$ 12,50')).toEqual({
      description: 'MERCADO',
      amount: 12.5,
      date: '2026-03-10',
    });
  });

  test('não escolhe um valor quando há vários números e nenhum total', () => {
    expect(parseReceiptText('ITEM A 3,00\nITEM B 4,00').amount).toBeNull();
  });

  test('usa o total final e ignora o subtotal', () => {
    expect(parseReceiptText('SUBTOTAL 25,00\nTOTAL 30,00').amount).toBe(30);
    expect(parseReceiptText('SUBTOTAL R$ 25,00\nVALOR A PAGAR R$ 30,00').amount).toBe(30);
    expect(parseReceiptText('SUB-TOTAL 25,00\nAMOUNT DUE 30,00').amount).toBe(30);
  });

  test('não escolhe o subtotal quando há outro preço e nenhum total final', () => {
    expect(parseReceiptText('SUBTOTAL 25,00\nITEM 5,00').amount).toBeNull();
  });

  test('não usa cabeçalho, documento ou pagamento como estabelecimento', () => {
    expect(
      parseReceiptText(
        'CUPOM FISCAL\nCNPJ 12.345.678/0001-90\nRua das Flores, 10\n(11) 98888-7777\nCARTAO DEBITO\nTOTAL 10,00'
      )
    ).toEqual({
      description: null,
      amount: 10,
      date: null,
    });
  });

  test('usa o nome do estabelecimento antes dos itens', () => {
    expect(parseReceiptText('CUPOM FISCAL\nPADARIA DO JOAO\nPao 3,00\nTOTAL 3,00')).toMatchObject({
      description: 'PADARIA DO JOAO',
      amount: 3,
    });
  });

  test('ignora data impossível e texto vazio', () => {
    expect(parseReceiptText('32/13/2020')).toEqual({
      description: null,
      amount: null,
      date: null,
    });
    expect(parseReceiptText('')).toEqual({
      description: null,
      amount: null,
      date: null,
    });
  });

  test('o rascunho não inventa valor ausente', () => {
    expect(draftFromRecognition({ text: 'PADARIA', imageUri: 'file://nota.jpg' })).toMatchObject({
      description: 'PADARIA',
      amountText: '',
      dateText: '',
      category: '',
      ocrText: 'PADARIA',
      notice: null,
    });
  });
});

describe('valores', () => {
  function amount(value) {
    return parseAmountInput(value).amount;
  }

  test('lê decimais e milhares no formato brasileiro', () => {
    expect(amount('10,50')).toBe(10.5);
    expect(amount('1.234,56')).toBe(1234.56);
    expect(amount('1234,56')).toBe(1234.56);
    expect(amount('1.234')).toBe(1234);
    expect(amount('1234')).toBe(1234);
    expect(amount('10.50')).toBe(10.5);
  });

  test('rejeita zero e texto inválido', () => {
    expect(parseAmountInput('0').ok).toBe(false);
    expect(parseAmountInput('0,00').ok).toBe(false);
    expect(parseAmountInput('').ok).toBe(false);
    expect(parseAmountInput('abc').ok).toBe(false);
    expect(parseAmountInput('12,345').ok).toBe(false);
  });
});

describe('validação do gasto', () => {
  test('exige valor numérico e categoria conhecida', () => {
    const missing = validateExpenseDraft(
      { description: '', amountText: '', dateText: '', category: '', ocrText: null },
      undefined
    );
    expect(missing.ok).toBe(false);
    expect(missing.errors.amount).toBe('Informe o valor.');
    expect(missing.errors.category).toBe('Escolha uma categoria válida.');

    const invalid = validateExpenseDraft(
      { description: 'Padaria', amountText: 'abc', dateText: '2026-13-40', category: 'Inexistente', ocrText: null },
      undefined
    );
    expect(invalid.errors.amount).toBe('Informe um valor numérico maior que zero.');
    expect(invalid.errors.date).toBe('Use a data no formato AAAA-MM-DD.');

    const valid = validateExpenseDraft(
      { description: ' Padaria ', amountText: '10,50', dateText: '', category: 'Supermercado', ocrText: ' ' },
      undefined
    );
    expect(valid.ok).toBe(true);
    expect(valid.fields).toMatchObject({
      amount: 10.5,
      description: 'Padaria',
      date: null,
      category: 'Supermercado',
      ocrText: null,
    });
  });

  test('mantém categoria antiga na edição', () => {
    const result = validateExpenseDraft(
      { description: '', amountText: '2', dateText: '2026-01-02', category: 'Categoria antiga', ocrText: null },
      'Categoria antiga'
    );
    expect(result.ok).toBe(true);
  });
});

describe('gráfico', () => {
  test('soma gastos reais por categoria', () => {
    const summary = summarizeExpenses([
      { category: 'Pets', amount: 10 },
      { category: 'Supermercado', amount: 5.5 },
      { category: 'Pets', amount: 2 },
      { category: 'Supermercado', amount: 0 },
    ]);

    expect(summary).toEqual([
      { category: 'Pets', total: 12 },
      { category: 'Supermercado', total: 5.5 },
    ]);
    expect(formatBrl(1234.5)).toBe('R$ 1.234,50');
  });

  test('mostra o período pela ordem das datas', () => {
    expect(
      periodLabel([{ date: '2026-04-02' }, { date: '2026-01-10' }, { date: null }])
    ).toBe('jan 2026 – abr 2026');
    expect(periodLabel([{ date: '2026-04-02' }])).toBe('abr 2026');
    expect(periodLabel([{ date: null }])).toBe('Todos os gastos');
  });

  test('fica vazio sem gastos utilizáveis', () => {
    expect(summarizeExpenses([])).toEqual([]);
    expect(summarizeExpenses([{ category: 'Pets', amount: null }])).toEqual([]);
  });
});
