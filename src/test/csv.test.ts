import { describe, expect, it } from 'vitest';
import { buildCsv, escapeCsvCell } from '../utils/csv';

describe('csv utilities', () => {
  it('quotes cells and escapes quotes', () => {
    expect(escapeCsvCell('Acme "Safety"')).toBe('"Acme ""Safety"""');
  });

  it('neutralizes spreadsheet formula prefixes', () => {
    expect(escapeCsvCell('=HYPERLINK("https://example.test")')).toBe('"\'=HYPERLINK(""https://example.test"")"');
    expect(escapeCsvCell('+SUM(1,2)')).toBe('"\'+SUM(1,2)"');
    expect(escapeCsvCell('-10+20')).toBe('"\'-10+20"');
    expect(escapeCsvCell('@cmd')).toBe('"\'@cmd"');
  });

  it('builds csv rows with safe cells', () => {
    expect(buildCsv([['Name', 'Value'], ['Driver', '=1+1']])).toBe('"Name","Value"\n"Driver","\'=1+1"');
  });
});
