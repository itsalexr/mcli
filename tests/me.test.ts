import { fetchMe } from '../src/commands/me';
import { createMockClient } from './helpers/mock-client';

const ME_RESPONSE = {
  me: {
    id: '42',
    name: 'Alice',
    email: 'alice@test.com',
    title: 'Engineer',
    account: { id: '1', name: 'Test Corp' },
  },
};

describe('fetchMe', () => {
  it('returns me data on success', async () => {
    const mock = createMockClient();
    mock.setResponse(ME_RESPONSE);
    const result = await fetchMe(mock.client);
    expect(result.me.id).toBe('42');
    expect(result.me.name).toBe('Alice');
    expect(result.me.account.name).toBe('Test Corp');
  });

  it('sends a query containing "me"', async () => {
    const mock = createMockClient();
    mock.setResponse(ME_RESPONSE);
    await fetchMe(mock.client);
    const queryArg = mock.request.mock.calls[0][0] as string;
    expect(queryArg).toContain('me');
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Unauthorized');
    await expect(fetchMe(mock.client)).rejects.toThrow('Unauthorized');
  });

  it('outputs JSON when printOutput called with json format', async () => {
    const mock = createMockClient();
    mock.setResponse(ME_RESPONSE);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { printOutput } = require('../src/output');
    const data = await fetchMe(mock.client);
    printOutput(data.me, 'json', () => ({ headers: [], rows: [] }));
    const output = logSpy.mock.calls[0][0] as string;
    expect(JSON.parse(output).id).toBe('42');
  });
});
