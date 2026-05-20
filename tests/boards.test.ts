import {
  fetchBoards,
  fetchBoardInfo,
  fetchBoardSchema,
  createBoard,
  fetchBoardActivity,
  BoardsListResult,
  BoardInfoResult,
  BoardSchemaResult,
  CreateBoardResult,
  BoardActivityResult,
} from '../src/commands/boards';
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

const BOARD_SCHEMA_RESPONSE: BoardSchemaResult = {
  boards: [
    {
      columns: [
        { id: 'name', title: 'Name', type: 'name' },
        { id: 'status', title: 'Status', type: 'color' },
      ],
      groups: [
        { id: 'grp1', title: 'In Progress' },
        { id: 'grp2', title: 'Done' },
      ],
    },
  ],
};

describe('fetchBoardSchema', () => {
  it('returns columns and groups', async () => {
    const mock = createMockClient();
    mock.setResponse(BOARD_SCHEMA_RESPONSE);
    const result = await fetchBoardSchema(mock.client, '10');
    expect(result.boards[0].columns).toHaveLength(2);
    expect(result.boards[0].groups).toHaveLength(2);
  });

  it('passes boardId', async () => {
    const mock = createMockClient();
    mock.setResponse(BOARD_SCHEMA_RESPONSE);
    await fetchBoardSchema(mock.client, '77');
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.boardId).toBe('77');
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('Not found');
    await expect(fetchBoardSchema(mock.client, '10')).rejects.toThrow('Not found');
  });
});

const CREATE_BOARD_RESPONSE: CreateBoardResult = {
  create_board: { id: '500', name: 'New Board', url: 'https://monday.com/boards/500' },
};

describe('createBoard', () => {
  it('creates board with name and kind', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_BOARD_RESPONSE);
    const result = await createBoard(mock.client, { name: 'New Board', kind: 'public' });
    expect(result.create_board.id).toBe('500');
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.boardName).toBe('New Board');
    expect(vars.boardKind).toBe('public');
  });

  it('passes optional description and workspaceId', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_BOARD_RESPONSE);
    await createBoard(mock.client, { name: 'New Board', kind: 'private', description: 'Desc', workspaceId: '42' });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.boardDescription).toBe('Desc');
    expect(vars.workspaceId).toBe('42');
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('No permission');
    await expect(createBoard(mock.client, { name: 'x', kind: 'public' })).rejects.toThrow('No permission');
  });
});

const ACTIVITY_RESPONSE: BoardActivityResult = {
  boards: [
    {
      activity_logs: [
        { user_id: '1', event: 'create_pulse', entity: 'pulse', created_at: '2024-01-01T00:00:00Z' },
        { user_id: '2', event: 'change_column_value', entity: 'pulse', created_at: '2024-01-02T00:00:00Z' },
      ],
    },
  ],
};

describe('fetchBoardActivity', () => {
  it('returns activity logs', async () => {
    const mock = createMockClient();
    mock.setResponse(ACTIVITY_RESPONSE);
    const result = await fetchBoardActivity(mock.client, '10', { from: '2024-01-01', to: '2024-01-31', limit: 50 });
    expect(result.boards[0].activity_logs).toHaveLength(2);
  });

  it('passes from, to, and limit variables', async () => {
    const mock = createMockClient();
    mock.setResponse(ACTIVITY_RESPONSE);
    await fetchBoardActivity(mock.client, '10', { from: '2024-01-01', to: '2024-01-31', limit: 100 });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.from).toBe('2024-01-01');
    expect(vars.to).toBe('2024-01-31');
    expect(vars.limit).toBe(100);
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('Server error');
    await expect(fetchBoardActivity(mock.client, '10', { from: '2024-01-01', to: '2024-01-31', limit: 50 })).rejects.toThrow('Server error');
  });
});
