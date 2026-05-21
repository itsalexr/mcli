import { fetchDocs, createDoc, addContentToDoc } from '../src/commands/docs';
import { createMockClient } from './helpers/mock-client';

const DOCS_RESPONSE = {
  docs: [
    {
      id: '1',
      name: 'Product Spec',
      doc_kind: 'public',
      created_at: '2024-01-01T00:00:00Z',
      url: 'https://monday.com/docs/1',
      workspace_id: '10',
      doc_folder_id: null,
      created_by: { id: '5', name: 'Alice' },
    },
    {
      id: '2',
      name: 'Design Notes',
      doc_kind: 'private',
      created_at: '2024-01-02T00:00:00Z',
      url: 'https://monday.com/docs/2',
      workspace_id: '10',
      doc_folder_id: null,
      created_by: { id: '6', name: 'Bob' },
    },
  ],
};

const CREATE_DOC_RESPONSE = {
  create_doc: { id: '99', object_id: '99', url: 'https://monday.com/docs/99', name: 'My Doc' },
};

const ADD_CONTENT_RESPONSE = {
  add_content_to_doc_from_markdown: { success: true, block_ids: ['block1'], error: null },
};

describe('fetchDocs', () => {
  it('returns docs list', async () => {
    const mock = createMockClient();
    mock.setResponse(DOCS_RESPONSE);
    const result = await fetchDocs(mock.client, { limit: 50, page: 1 });
    expect(result.docs).toHaveLength(2);
    expect(result.docs[0].name).toBe('Product Spec');
  });

  it('passes workspace_ids when workspaceId provided', async () => {
    const mock = createMockClient();
    mock.setResponse(DOCS_RESPONSE);
    await fetchDocs(mock.client, { workspaceId: '10', limit: 50, page: 1 });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.workspace_ids).toEqual(['10']);
  });

  it('passes undefined workspace_ids when not provided', async () => {
    const mock = createMockClient();
    mock.setResponse(DOCS_RESPONSE);
    await fetchDocs(mock.client, { limit: 25, page: 2 });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.workspace_ids).toBeUndefined();
    expect(vars.limit).toBe(25);
    expect(vars.page).toBe(2);
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('Unauthorized');
    await expect(fetchDocs(mock.client, { limit: 50, page: 1 })).rejects.toThrow('Unauthorized');
  });
});

describe('createDoc', () => {
  it('creates doc in workspace', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_DOC_RESPONSE);
    const result = await createDoc(mock.client, { name: 'My Doc', workspaceId: '10', kind: 'public' });
    expect(result.create_doc.id).toBe('99');
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    const location = vars.location as Record<string, unknown>;
    expect(location).toHaveProperty('workspace');
  });

  it('includes folderId in location when provided', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_DOC_RESPONSE);
    await createDoc(mock.client, { name: 'My Doc', workspaceId: '10', kind: 'public', folderId: '5' });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    const workspace = (vars.location as Record<string, unknown>).workspace as Record<string, unknown>;
    expect(workspace.folder_id).toBe('5');
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('Forbidden');
    await expect(createDoc(mock.client, { name: 'x', workspaceId: '1', kind: 'public' })).rejects.toThrow('Forbidden');
  });
});

describe('addContentToDoc', () => {
  it('adds content and returns success', async () => {
    const mock = createMockClient();
    mock.setResponse(ADD_CONTENT_RESPONSE);
    const result = await addContentToDoc(mock.client, '99', '# Hello');
    expect(result.add_content_to_doc_from_markdown.success).toBe(true);
    expect(result.add_content_to_doc_from_markdown.block_ids).toHaveLength(1);
  });

  it('passes docId and markdown as variables', async () => {
    const mock = createMockClient();
    mock.setResponse(ADD_CONTENT_RESPONSE);
    await addContentToDoc(mock.client, '42', '## Section');
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.docId).toBe('42');
    expect(vars.markdown).toBe('## Section');
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('Doc not found');
    await expect(addContentToDoc(mock.client, '1', 'text')).rejects.toThrow('Doc not found');
  });
});
