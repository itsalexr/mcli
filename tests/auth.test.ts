import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { saveToken, clearToken, runAuthStatus } from '../src/commands/auth';
import { createMockClient } from './helpers/mock-client';

function tmpFile(): string {
  return path.join(os.tmpdir(), `mcli-test-${Date.now()}-${Math.random()}.env`);
}

describe('saveToken', () => {
  let file: string;

  beforeEach(() => {
    file = tmpFile();
  });

  afterEach(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });

  it('creates .env with token when file absent', () => {
    saveToken('mytoken', file);
    expect(fs.readFileSync(file, 'utf8')).toContain('MONDAY_TOKEN=mytoken');
  });

  it('updates existing MONDAY_TOKEN and preserves other vars', () => {
    fs.writeFileSync(file, 'OTHER=foo\nMONDAY_TOKEN=old\nANOTHER=bar\n');
    saveToken('new', file);
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toContain('MONDAY_TOKEN=new');
    expect(content).not.toContain('MONDAY_TOKEN=old');
    expect(content).toContain('OTHER=foo');
    expect(content).toContain('ANOTHER=bar');
  });

  it('appends token when other vars exist but no MONDAY_TOKEN', () => {
    fs.writeFileSync(file, 'OTHER=foo\n');
    saveToken('mytoken', file);
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toContain('MONDAY_TOKEN=mytoken');
    expect(content).toContain('OTHER=foo');
  });
});

describe('clearToken', () => {
  let file: string;

  beforeEach(() => {
    file = tmpFile();
  });

  afterEach(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });

  it('removes MONDAY_TOKEN line and preserves other vars', () => {
    fs.writeFileSync(file, 'OTHER=foo\nMONDAY_TOKEN=mytoken\nANOTHER=bar\n');
    clearToken(file);
    const content = fs.readFileSync(file, 'utf8');
    expect(content).not.toContain('MONDAY_TOKEN');
    expect(content).toContain('OTHER=foo');
  });

  it('is a no-op if file absent', () => {
    expect(() => clearToken(file)).not.toThrow();
  });

  it('leaves empty content when MONDAY_TOKEN is the only entry', () => {
    fs.writeFileSync(file, 'MONDAY_TOKEN=mytoken\n');
    clearToken(file);
    const content = fs.readFileSync(file, 'utf8');
    expect(content).not.toContain('MONDAY_TOKEN');
  });
});

describe('runAuthStatus', () => {
  it('calls me query and prints user info as JSON', async () => {
    const mock = createMockClient();
    mock.setResponse({
      me: {
        id: '42',
        name: 'Alice',
        email: 'alice@test.com',
        title: null,
        account: { id: '1', name: 'Test Corp' },
      },
    });

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runAuthStatus(mock.client, 'json');

    const output = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.id).toBe('42');
    expect(parsed.name).toBe('Alice');
    expect(parsed.email).toBe('alice@test.com');
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Unauthorized');
    await expect(runAuthStatus(mock.client, 'json')).rejects.toThrow('Unauthorized');
  });
});
