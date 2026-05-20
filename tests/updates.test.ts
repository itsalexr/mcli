import { createUpdate, fetchUpdates } from '../src/commands/updates';
import { createMockClient } from './helpers/mock-client';

const CREATE_UPDATE_RESPONSE = {
  create_update: {
    id: '500',
    item_id: '101',
    item: { name: 'Task A', url: 'https://monday.com/boards/10/pulses/101' },
  },
};

describe('createUpdate', () => {
  it('creates update with itemId and body', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_UPDATE_RESPONSE);
    const result = await createUpdate(mock.client, '101', 'Hello world');
    expect(result.create_update.id).toBe('500');
    expect(result.create_update.item.name).toBe('Task A');
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.itemId).toBe('101');
    expect(vars.body).toBe('Hello world');
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Item not found');
    await expect(createUpdate(mock.client, '101', 'text')).rejects.toThrow('Item not found');
  });
});

describe('fetchUpdates', () => {
  const UPDATES_RESPONSE = {
    items: [
      {
        id: '101',
        updates: [
          { id: '1', text_body: 'First comment', created_at: '2024-01-01', creator: { id: '5', name: 'Alice' } },
          { id: '2', text_body: 'Second comment', created_at: '2024-01-02', creator: null },
        ],
      },
    ],
  };

  it('returns updates for item', async () => {
    const mock = createMockClient();
    mock.setResponse(UPDATES_RESPONSE);
    const result = await fetchUpdates(mock.client, '101', { limit: 25, page: 1 });
    expect(result.items[0].updates).toHaveLength(2);
    expect(result.items[0].updates[0].text_body).toBe('First comment');
  });

  it('passes itemId, limit, and page', async () => {
    const mock = createMockClient();
    mock.setResponse(UPDATES_RESPONSE);
    await fetchUpdates(mock.client, '101', { limit: 10, page: 2 });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.itemId).toBe('101');
    expect(vars.limit).toBe(10);
    expect(vars.page).toBe(2);
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Not found');
    await expect(fetchUpdates(mock.client, '101', { limit: 25, page: 1 })).rejects.toThrow('Not found');
  });
});
