import {
  fetchItems,
  createItem,
  updateItemColumns,
  ItemsPageResult,
} from '../src/commands/items';
import { createMockClient } from './helpers/mock-client';

const ITEMS_PAGE_RESPONSE: ItemsPageResult = {
  boards: [
    {
      items_page: {
        items: [
          {
            id: '101',
            name: 'Task A',
            url: 'https://monday.com/boards/10/pulses/101',
            created_at: '2024-01-01',
            updated_at: '2024-01-02',
            column_values: [],
          },
          {
            id: '102',
            name: 'Task B',
            url: 'https://monday.com/boards/10/pulses/102',
            created_at: '2024-01-03',
            updated_at: '2024-01-04',
            column_values: [],
          },
        ],
        cursor: null,
      },
    },
  ],
};

describe('fetchItems', () => {
  it('returns items page on success', async () => {
    const mock = createMockClient();
    mock.setResponse(ITEMS_PAGE_RESPONSE);
    const result = await fetchItems(mock.client, '10', { limit: 25, includeColumns: false });
    expect(result.boards[0].items_page.items).toHaveLength(2);
  });

  it('passes boardId and includeColumns=false', async () => {
    const mock = createMockClient();
    mock.setResponse(ITEMS_PAGE_RESPONSE);
    await fetchItems(mock.client, '10', { limit: 25, includeColumns: false });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.boardId).toBe('10');
    expect(vars.includeColumns).toBe(false);
  });

  it('passes includeColumns=true with --columns flag', async () => {
    const mock = createMockClient();
    mock.setResponse(ITEMS_PAGE_RESPONSE);
    await fetchItems(mock.client, '10', { limit: 25, includeColumns: true });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.includeColumns).toBe(true);
  });

  it('passes cursor when provided', async () => {
    const mock = createMockClient();
    mock.setResponse(ITEMS_PAGE_RESPONSE);
    await fetchItems(mock.client, '10', { limit: 25, includeColumns: false, cursor: 'abc123' });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.cursor).toBe('abc123');
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Board not found');
    await expect(
      fetchItems(mock.client, '10', { limit: 25, includeColumns: false })
    ).rejects.toThrow('Board not found');
  });
});

describe('createItem', () => {
  const CREATE_RESPONSE = { create_item: { id: '200', name: 'New Task', url: 'https://monday.com/boards/10/pulses/200' } };

  it('creates item with required fields', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_RESPONSE);
    const result = await createItem(mock.client, '10', { name: 'New Task' });
    expect(result.create_item.id).toBe('200');
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.boardId).toBe('10');
    expect(vars.itemName).toBe('New Task');
  });

  it('passes groupId and columnValues when provided', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_RESPONSE);
    await createItem(mock.client, '10', {
      name: 'Task',
      groupId: 'grp1',
      columnValues: '{"status": "Done"}',
    });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.groupId).toBe('grp1');
    expect(vars.columnValues).toBe('{"status": "Done"}');
  });

  it('leaves groupId and columnValues undefined when not provided', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_RESPONSE);
    await createItem(mock.client, '10', { name: 'Task' });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.groupId).toBeUndefined();
    expect(vars.columnValues).toBeUndefined();
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Not allowed');
    await expect(createItem(mock.client, '10', { name: 'Task' })).rejects.toThrow('Not allowed');
  });
});

describe('updateItemColumns', () => {
  const UPDATE_RESPONSE = {
    change_multiple_column_values: { id: '101', name: 'Task A', url: 'https://monday.com/boards/10/pulses/101' },
  };

  it('updates column values successfully', async () => {
    const mock = createMockClient();
    mock.setResponse(UPDATE_RESPONSE);
    const result = await updateItemColumns(mock.client, '10', '101', '{"status": "Done"}');
    expect(result.change_multiple_column_values.id).toBe('101');
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.boardId).toBe('10');
    expect(vars.itemId).toBe('101');
    expect(vars.columnValues).toBe('{"status": "Done"}');
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Invalid column');
    await expect(updateItemColumns(mock.client, '10', '101', '{}')).rejects.toThrow('Invalid column');
  });
});
