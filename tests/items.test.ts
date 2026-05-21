import {
  fetchItems,
  createItem,
  updateItemColumns,
  deleteItem,
  moveItemToGroup,
  createSubitem,
  duplicateItem,
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

describe('deleteItem', () => {
  it('deletes item and returns id', async () => {
    const mock = createMockClient();
    mock.setResponse({ delete_item: { id: '101' } });
    const result = await deleteItem(mock.client, '101');
    expect(result.delete_item.id).toBe('101');
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.itemId).toBe('101');
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Item not found');
    await expect(deleteItem(mock.client, '999')).rejects.toThrow('Item not found');
  });
});

describe('moveItemToGroup', () => {
  it('moves item to group', async () => {
    const mock = createMockClient();
    mock.setResponse({ move_item_to_group: { id: '101' } });
    const result = await moveItemToGroup(mock.client, '101', 'grp_done');
    expect(result.move_item_to_group.id).toBe('101');
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.itemId).toBe('101');
    expect(vars.groupId).toBe('grp_done');
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Group not found');
    await expect(moveItemToGroup(mock.client, '101', 'bad_grp')).rejects.toThrow('Group not found');
  });
});

describe('createSubitem', () => {
  const SUBITEM_RESPONSE = {
    create_subitem: { id: '200', name: 'Sub-task', url: 'https://monday.com/items/200', parent_item: { id: '101' } },
  };

  it('creates a subitem under a parent item', async () => {
    const mock = createMockClient();
    mock.setResponse(SUBITEM_RESPONSE);
    const result = await createSubitem(mock.client, '101', { name: 'Sub-task' });
    expect(result.create_subitem.id).toBe('200');
    expect(result.create_subitem.parent_item.id).toBe('101');
  });

  it('passes parentItemId and itemName as variables', async () => {
    const mock = createMockClient();
    mock.setResponse(SUBITEM_RESPONSE);
    await createSubitem(mock.client, '101', { name: 'Sub-task' });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.parentItemId).toBe('101');
    expect(vars.itemName).toBe('Sub-task');
  });

  it('passes columnValues when provided', async () => {
    const mock = createMockClient();
    mock.setResponse(SUBITEM_RESPONSE);
    await createSubitem(mock.client, '101', { name: 'Sub', columnValues: '{"status": "Done"}' });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.columnValues).toBe('{"status": "Done"}');
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('Parent not found');
    await expect(createSubitem(mock.client, '999', { name: 'x' })).rejects.toThrow('Parent not found');
  });
});

describe('duplicateItem', () => {
  const DUPLICATE_RESPONSE = {
    duplicate_item: { id: '201', name: 'Task A (copy)', url: 'https://monday.com/items/201' },
  };

  it('duplicates an item and returns the new item', async () => {
    const mock = createMockClient();
    mock.setResponse(DUPLICATE_RESPONSE);
    const result = await duplicateItem(mock.client, '10', '101');
    expect(result.duplicate_item.id).toBe('201');
    expect(result.duplicate_item.name).toBe('Task A (copy)');
  });

  it('passes boardId, itemId, and withUpdates as variables', async () => {
    const mock = createMockClient();
    mock.setResponse(DUPLICATE_RESPONSE);
    await duplicateItem(mock.client, '10', '101', true);
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.boardId).toBe('10');
    expect(vars.itemId).toBe('101');
    expect(vars.withUpdates).toBe(true);
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('Item not found');
    await expect(duplicateItem(mock.client, '10', '999')).rejects.toThrow('Item not found');
  });
});
