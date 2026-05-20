import { fetchWorkspaces, WorkspacesResult } from '../src/commands/workspaces';
import { createMockClient } from './helpers/mock-client';

const WORKSPACES_RESPONSE = {
  workspaces: [
    { id: '1', name: 'Main', description: 'Main workspace' },
    { id: '2', name: 'Dev', description: null },
  ],
};

describe('fetchWorkspaces', () => {
  it('returns workspace list', async () => {
    const mock = createMockClient();
    mock.setResponse(WORKSPACES_RESPONSE);
    const result = await fetchWorkspaces(mock.client, { limit: 50, page: 1 });
    expect(result.workspaces).toHaveLength(2);
    expect(result.workspaces[0].name).toBe('Main');
  });

  it('passes limit and page to the query', async () => {
    const mock = createMockClient();
    mock.setResponse(WORKSPACES_RESPONSE);
    await fetchWorkspaces(mock.client, { limit: 10, page: 2 });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.limit).toBe(10);
    expect(vars.page).toBe(2);
  });

  it('uses default limit=50 page=1 when not specified', async () => {
    const mock = createMockClient();
    mock.setResponse({ workspaces: [] });
    await fetchWorkspaces(mock.client, { limit: 50, page: 1 });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.limit).toBe(50);
    expect(vars.page).toBe(1);
  });

  it('returns empty array gracefully', async () => {
    const mock = createMockClient();
    mock.setResponse({ workspaces: [] });
    const result = await fetchWorkspaces(mock.client, { limit: 50, page: 1 });
    expect(result.workspaces).toHaveLength(0);
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Forbidden');
    await expect(fetchWorkspaces(mock.client, { limit: 50, page: 1 })).rejects.toThrow('Forbidden');
  });

  it('table output renders ID, Name, Description columns', async () => {
    const mock = createMockClient();
    mock.setResponse(WORKSPACES_RESPONSE);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { printOutput } = require('../src/output');
    const data = await fetchWorkspaces(mock.client, { limit: 50, page: 1 });
    printOutput(data.workspaces, 'table', (ws: WorkspacesResult['workspaces']) => ({
      headers: ['ID', 'Name', 'Description'],
      rows: ws.map((w) => [w.id, w.name, w.description ?? '']),
    }));
    const output = logSpy.mock.calls[0][0] as string;
    expect(output).toContain('ID');
    expect(output).toContain('Main');
    expect(output).toContain('Dev');
  });
});
