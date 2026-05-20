import { createUpdate } from '../src/commands/updates';
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
