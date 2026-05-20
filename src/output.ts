import Table from 'cli-table3';

export type OutputFormat = 'json' | 'table';

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printTable(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const table = new Table({ head: headers });
  for (const row of rows) {
    table.push(row.map((cell) => (cell == null ? '' : String(cell))));
  }
  console.log(table.toString());
}

export function printOutput<T>(
  data: T,
  format: OutputFormat,
  toTableArgs: (data: T) => { headers: string[]; rows: string[][] }
): void {
  if (format === 'table') {
    const { headers, rows } = toTableArgs(data);
    printTable(headers, rows);
  } else {
    printJson(data);
  }
}
