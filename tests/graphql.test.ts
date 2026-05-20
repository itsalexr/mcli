import { runRawGraphql } from '../src/commands/graphql';
import { createMockClient } from './helpers/mock-client';

describe('runRawGraphql', () => {
  it('passes query string to client verbatim', async () => {
    const mock = createMockClient();
    mock.setResponse({ me: { id: '1' } });
    const query = '{ me { id name } }';
    await runRawGraphql(mock.client, query);
    expect(mock.request.mock.calls[0][0]).toBe(query);
  });

  it('parses variables JSON and passes as object', async () => {
    const mock = createMockClient();
    mock.setResponse({ boards: [] });
    await runRawGraphql(mock.client, 'query { boards { id } }', '{"limit": 5}');
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars).toEqual({ limit: 5 });
  });

  it('passes undefined variables when not provided', async () => {
    const mock = createMockClient();
    mock.setResponse({ me: { id: '1' } });
    await runRawGraphql(mock.client, '{ me { id } }');
    expect(mock.request.mock.calls[0][1]).toBeUndefined();
  });

  it('throws on invalid variables JSON', async () => {
    const mock = createMockClient();
    await expect(runRawGraphql(mock.client, '{ me { id } }', 'not-json')).rejects.toThrow();
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Syntax error');
    await expect(runRawGraphql(mock.client, '{ invalid }')).rejects.toThrow('Syntax error');
  });
});
