import { printJson, printTable, printOutput } from '../src/output';

describe('printJson', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('outputs valid JSON with 2-space indent', () => {
    printJson({ id: '1', name: 'Test' });
    expect(logSpy).toHaveBeenCalledTimes(1);
    const output = logSpy.mock.calls[0][0] as string;
    expect(JSON.parse(output)).toEqual({ id: '1', name: 'Test' });
    expect(output).toContain('  ');
  });

  it('handles arrays', () => {
    printJson([{ id: '1' }, { id: '2' }]);
    const output = logSpy.mock.calls[0][0] as string;
    expect(JSON.parse(output)).toHaveLength(2);
  });
});

describe('printTable', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('renders headers in output', () => {
    printTable(['ID', 'Name', 'Email'], [['1', 'Alice', 'alice@test.com']]);
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('ID');
    expect(output).toContain('Name');
    expect(output).toContain('Alice');
  });

  it('coerces null and undefined to empty string', () => {
    printTable(['ID', 'Name'], [['1', null], ['2', undefined]]);
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('1');
    expect(output).toContain('2');
  });

  it('handles numeric values', () => {
    printTable(['ID', 'Count'], [['1', 42]]);
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('42');
  });
});

describe('printOutput', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('uses printJson for json format', () => {
    const data = { id: '42' };
    printOutput(data, 'json', () => ({ headers: [], rows: [] }));
    const output = logSpy.mock.calls[0][0] as string;
    expect(JSON.parse(output)).toEqual(data);
  });

  it('uses printTable for table format', () => {
    const data = [{ id: '1', name: 'Alice' }];
    printOutput(
      data,
      'table',
      (d) => ({ headers: ['ID', 'Name'], rows: d.map((x) => [x.id, x.name]) })
    );
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('ID');
    expect(output).toContain('Alice');
  });
});
