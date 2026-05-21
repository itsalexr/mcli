import { fetchUsers, fetchTeams } from '../src/commands/users';
import { createMockClient } from './helpers/mock-client';

const USERS_RESPONSE = {
  users: [
    { id: '1', name: 'Alice', email: 'alice@example.com', title: 'Engineer', is_admin: true, is_guest: false },
    { id: '2', name: 'Bob', email: 'bob@example.com', title: null, is_admin: false, is_guest: false },
  ],
};

const TEAMS_RESPONSE = {
  teams: [
    {
      id: '10',
      name: 'Engineering',
      is_guest: false,
      picture_url: null,
      users: [
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
      ],
    },
    {
      id: '11',
      name: 'Design',
      is_guest: false,
      picture_url: null,
      users: [{ id: '3', name: 'Carol', email: 'carol@example.com' }],
    },
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

describe('fetchTeams', () => {
  it('returns teams list', async () => {
    const mock = createMockClient();
    mock.setResponse(TEAMS_RESPONSE);
    const result = await fetchTeams(mock.client);
    expect(result.teams).toHaveLength(2);
    expect(result.teams[0].name).toBe('Engineering');
    expect(result.teams[0].users).toHaveLength(2);
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('Forbidden');
    await expect(fetchTeams(mock.client)).rejects.toThrow('Forbidden');
  });
});
