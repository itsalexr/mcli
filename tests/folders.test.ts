import { createFolder } from '../src/commands/folders';
import { createMockClient } from './helpers/mock-client';

const CREATE_FOLDER_RESPONSE = {
  create_folder: { id: '20', name: 'My Folder' },
};

describe('createFolder', () => {
  it('creates a folder and returns id and name', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_FOLDER_RESPONSE);
    const result = await createFolder(mock.client, { workspaceId: '10', name: 'My Folder' });
    expect(result.create_folder.id).toBe('20');
    expect(result.create_folder.name).toBe('My Folder');
  });

  it('passes workspaceId and name as variables', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_FOLDER_RESPONSE);
    await createFolder(mock.client, { workspaceId: '10', name: 'Sprint Docs' });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.workspaceId).toBe('10');
    expect(vars.name).toBe('Sprint Docs');
  });

  it('passes color when provided', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_FOLDER_RESPONSE);
    await createFolder(mock.client, { workspaceId: '10', name: 'Dev', color: 'bright-red' });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.color).toBe('bright-red');
  });

  it('passes undefined color when not provided', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_FOLDER_RESPONSE);
    await createFolder(mock.client, { workspaceId: '10', name: 'Dev' });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.color).toBeUndefined();
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('Not found');
    await expect(createFolder(mock.client, { workspaceId: '99', name: 'x' })).rejects.toThrow('Not found');
  });
});
