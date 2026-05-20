import { createGroup } from '../src/commands/groups';
import { createMockClient } from './helpers/mock-client';

const CREATE_GROUP_RESPONSE = {
  create_group: { id: 'grp_123', title: 'Sprint 1' },
};

describe('createGroup', () => {
  it('creates group with boardId and name', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_GROUP_RESPONSE);
    const result = await createGroup(mock.client, '999', { name: 'Sprint 1' });
    expect(result.create_group.id).toBe('grp_123');
    expect(result.create_group.title).toBe('Sprint 1');
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.boardId).toBe('999');
    expect(vars.groupName).toBe('Sprint 1');
    expect(vars.groupColor).toBeUndefined();
  });

  it('passes color when provided', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_GROUP_RESPONSE);
    await createGroup(mock.client, '999', { name: 'Sprint 1', color: 'done' });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.groupColor).toBe('done');
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Board not found');
    await expect(createGroup(mock.client, '999', { name: 'Sprint 1' })).rejects.toThrow('Board not found');
  });
});
