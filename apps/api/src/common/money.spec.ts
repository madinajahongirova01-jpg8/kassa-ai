import { formatDirams, MAX_AMOUNT_DIRAMS, parseSomoni } from './money';

describe('parseSomoni', () => {
  it.each([
    ['150', 15_000],
    ['150.5', 15_050],
    ['150.50', 15_050],
    ['0.01', 1],
    ['  42.10 ', 4_210],
    ['10000000.00', MAX_AMOUNT_DIRAMS],
    [150.5, 15_050],
    [0.1, 10],
    [7, 700],
  ])('parses %p into %p dirams', (input, expected) => {
    expect(parseSomoni(input)).toBe(expected);
  });

  it('adds amounts that are imprecise in floating point exactly', () => {
    const sum = (parseSomoni('0.1') ?? 0) + (parseSomoni('0.2') ?? 0);

    expect(sum).toBe(30);
    expect(formatDirams(sum)).toBe('0.30');
  });

  it.each([
    ['-5'],
    ['1.234'],
    ['1,50'],
    ['abc'],
    [''],
    ['.5'],
    ['5.'],
    ['1e3'],
    ['123456789'],
    [Number.NaN],
    [Number.POSITIVE_INFINITY],
    [-1],
    [1.005],
    [1e21],
    [null],
    [true],
    [{}],
  ])('rejects %p', (input) => {
    expect(parseSomoni(input)).toBeUndefined();
  });
});

describe('formatDirams', () => {
  it.each([
    [0, '0.00'],
    [1, '0.01'],
    [15_050, '150.50'],
    [MAX_AMOUNT_DIRAMS, '10000000.00'],
    [-250, '-2.50'],
  ])('formats %p dirams as %p', (input, expected) => {
    expect(formatDirams(input)).toBe(expected);
  });

  it('rejects non-integer values', () => {
    expect(() => formatDirams(1.5)).toThrow(RangeError);
  });
});
