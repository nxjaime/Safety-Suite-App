const FORMULA_PREFIX_PATTERN = /^[=+\-@\t\r]/;

export const escapeCsvCell = (value: string | number | boolean | null | undefined): string => {
  const raw = String(value ?? '');
  const safe = FORMULA_PREFIX_PATTERN.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const buildCsv = (rows: Array<Array<string | number | boolean | null | undefined>>): string =>
  rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
