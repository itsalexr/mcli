import { searchBoards } from '../src/commands/search';
import { createMockClient } from './helpers/mock-client';

const BOARDS_RESPONSE = {
  boards: [
    { id: '1', name: 'Tasks', board_kind: 'public', workspace: { name: 'Team' } },
    { id: '2', name: 'Bugs Queue', board_kind: 'public', workspace: { name: 'Team' } },
    { id: '3', name: 'Epics', board_kind: 'private', workspace: null },
  ],
};

describe('searchBoards', () => {
  it('returns boards matching term (case-insensitive)', async () => {
    const mock = createMockClient();
    mock.setResponse(BOARDS_RESPONSE);
    const results = await searchBoards(mock.client, 'tasks');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Tasks');
  });

  it('returns multiple matches', async () => {
    const mock = createMockClient();
    mock.setResponse(BOARDS_RESPONSE);
    const results = await searchBoards(mock.client, 'e');
    expect(results.map((b) => b.name)).toEqual(['Bugs Queue', 'Epics']);
  });

  it('returns empty array when no match', async () => {
    const mock = createMockClient();
    mock.setResponse(BOARDS_RESPONSE);
    const results = await searchBoards(mock.client, 'zzznomatch');
    expect(results).toHaveLength(0);
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('API error');
    await expect(searchBoards(mock.client, 'tasks')).rejects.toThrow('API error');
  });
});
