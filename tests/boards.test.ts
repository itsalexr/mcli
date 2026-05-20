import { fetchBoards, fetchBoardInfo, BoardsListResult, BoardInfoResult } from '../src/commands/boards';
import { createMockClient } from './helpers/mock-client';

const BOARDS_RESPONSE: BoardsListResult = {
  boards: [
    { id: '10', name: 'Sprint Board', description: null, state: 'active', board_kind: 'public', workspace: { id: '1', name: 'Main' } },
    { id: '11', name: 'Backlog', description: 'Backlog items', state: 'active', board_kind: 'private', workspace: { id: '1', name: 'Main' } },
  ],
};

const BOARD_INFO_RESPONSE: BoardInfoResult = {
  boards: [
    {
      id: '10',
      name: 'Sprint Board',
      description: null,
      state: 'active',
      board_kind: 'public',
      columns: [
        { id: 'name', title: 'Name', type: 'name' },
        { id: 'status', title: 'Status', type: 'color' },
      ],
      groups: [
        { id: 'group_a', title: 'In Progress' },
        { id: 'group_b', title: 'Done' },
      ],
      workspace: { id: '1', name: 'Main' },
    },
  ],
};

describe('fetchBoards', () => {
  it('returns board list', async () => {
    const mock = createMockClient();
    mock.setResponse(BOARDS_RESPONSE);
    const result = await fetchBoards(mock.client, { limit: 50, page: 1 });
    expect(result.boards).toHaveLength(2);
  });

  it('passes workspaceId as array when provided', async () => {
    const mock = createMockClient();
    mock.setResponse(BOARDS_RESPONSE);
    await fetchBoards(mock.client, { limit: 50, page: 1, workspaceId: '42' });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.workspaceIds).toEqual(['42']);
  });

  it('passes undefined workspaceIds when not provided', async () => {
    const mock = createMockClient();
    mock.setResponse(BOARDS_RESPONSE);
    await fetchBoards(mock.client, { limit: 50, page: 1 });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.workspaceIds).toBeUndefined();
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('Not found');
    await expect(fetchBoards(mock.client, { limit: 50, page: 1 })).rejects.toThrow('Not found');
  });
});

describe('fetchBoardInfo', () => {
  it('returns board with columns and groups', async () => {
    const mock = createMockClient();
    mock.setResponse(BOARD_INFO_RESPONSE);
    const result = await fetchBoardInfo(mock.client, '10');
    const board = result.boards[0];
    expect(board.id).toBe('10');
    expect(board.columns).toHaveLength(2);
    expect(board.groups).toHaveLength(2);
  });

  it('passes boardId as variable', async () => {
    const mock = createMockClient();
    mock.setResponse(BOARD_INFO_RESPONSE);
    await fetchBoardInfo(mock.client, '99');
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.boardId).toBe('99');
  });

  it('returns empty boards array when board not found', async () => {
    const mock = createMockClient();
    mock.setResponse({ boards: [] });
    const result = await fetchBoardInfo(mock.client, '999');
    expect(result.boards).toHaveLength(0);
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('Permission denied');
    await expect(fetchBoardInfo(mock.client, '1')).rejects.toThrow('Permission denied');
  });

  it('table output renders board info, columns, and groups sections', async () => {
    const mock = createMockClient();
    mock.setResponse(BOARD_INFO_RESPONSE);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { printTable } = require('../src/output');
    const data = await fetchBoardInfo(mock.client, '10');
    const board = data.boards[0];
    printTable(['ID', 'Name', 'State'], [[board.id, board.name, board.state]]);
    printTable(['Column ID', 'Title', 'Type'], board.columns.map((c) => [c.id, c.title, c.type]));
    printTable(['Group ID', 'Title'], board.groups.map((g) => [g.id, g.title]));
    expect(logSpy).toHaveBeenCalledTimes(3);
    const firstOutput = logSpy.mock.calls[0][0] as string;
    expect(firstOutput).toContain('Sprint Board');
  });
});
