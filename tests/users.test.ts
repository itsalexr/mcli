import { fetchUsers } from '../src/commands/users';
import { createMockClient } from './helpers/mock-client';

const USERS_RESPONSE = {
  users: [
    { id: '1', name: 'Alice', email: 'alice@example.com', title: 'Engineer', is_admin: true, is_guest: false },
    { id: '2', name: 'Bob', email: 'bob@example.com', title: null, is_admin: false, is_guest: false },
  ],
};

describe('fetchUsers', () => {
  it('returns users list', async () => {
    const mock = createMockClient();
    mock.setResponse(USERS_RESPONSE);
    const result = await fetchUsers(mock.client, { limit: 200, page: 1 });
    expect(result.users).toHaveLength(2);
    expect(result.users[0].name).toBe('Alice');
    expect(result.users[0].is_admin).toBe(true);
  });

  it('passes limit and page variables', async () => {
    const mock = createMockClient();
    mock.setResponse(USERS_RESPONSE);
    await fetchUsers(mock.client, { limit: 50, page: 3 });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.limit).toBe(50);
    expect(vars.page).toBe(3);
  });

  it('propagates GraphQL errors', async () => {
    const mock = createMockClient();
    mock.setError('Unauthorized');
    await expect(fetchUsers(mock.client, { limit: 200, page: 1 })).rejects.toThrow('Unauthorized');
  });
});
