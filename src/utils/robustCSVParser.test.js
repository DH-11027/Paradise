import { robustParseCSV } from './robustCSVParser';

describe('robustParseCSV', () => {
  it('parses CSV text with BOM and multiple rows', () => {
    const csv = '\ufeffname,age\nAlice,30\nBob,25';
    const result = robustParseCSV(csv);
    expect(result).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' }
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(robustParseCSV('')).toEqual([]);
  });
});
