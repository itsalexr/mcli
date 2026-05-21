import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printTable, printJson } from '../output';
import { LIST_DOCS_QUERY, CREATE_DOC_MUTATION, ADD_CONTENT_TO_DOC_MUTATION } from '../queries/docs';

export interface DocsListResult {
  docs: Array<{
    id: string;
    name: string;
    doc_kind: string;
    created_at: string;
    url: string;
    workspace_id: string | null;
    doc_folder_id: string | null;
    created_by: { id: string; name: string } | null;
  }>;
}

export interface CreateDocResult {
  create_doc: { id: string; object_id: string; url: string; name: string };
}

export interface AddContentResult {
  add_content_to_doc_from_markdown: { success: boolean; block_ids: string[]; error: string | null };
}

export async function fetchDocs(
  client: GraphQLClient,
  opts: { workspaceId?: string; limit: number; page: number }
): Promise<DocsListResult> {
  return gqlRequest<DocsListResult>(client, LIST_DOCS_QUERY, {
    workspace_ids: opts.workspaceId ? [opts.workspaceId] : undefined,
    limit: opts.limit,
    page: opts.page,
  });
}

export async function createDoc(
  client: GraphQLClient,
  opts: { name: string; workspaceId: string; kind: string; folderId?: string }
): Promise<CreateDocResult> {
  return gqlRequest<CreateDocResult>(client, CREATE_DOC_MUTATION, {
    location: {
      workspace: {
        workspace_id: opts.workspaceId,
        name: opts.name,
        kind: opts.kind,
        ...(opts.folderId ? { folder_id: opts.folderId } : {}),
      },
    },
  });
}

export async function addContentToDoc(
  client: GraphQLClient,
  docId: string,
  markdown: string
): Promise<AddContentResult> {
  return gqlRequest<AddContentResult>(client, ADD_CONTENT_TO_DOC_MUTATION, { docId, markdown });
}

const DocsListOptionsSchema = z.object({
  workspaceId: z.string().optional(),
  limit: z.coerce.number().int().positive().default(50),
  page: z.coerce.number().int().positive().default(1),
});

const DocCreateOptionsSchema = z.object({
  name: z.string().min(1, 'Doc name is required'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  kind: z.enum(['public', 'private', 'share']).default('public'),
  content: z.string().optional(),
  folderId: z.string().optional(),
});

export function registerDocs(program: Command, clientFactory: () => GraphQLClient): void {
  const docs = program.command('docs').description('Manage monday.com docs');

  docs
    .command('list')
    .description('List docs')
    .option('--workspace-id <id>', 'Filter by workspace ID')
    .option('--limit <n>', 'Number of docs to return', '50')
    .option('--page <n>', 'Page number', '1')
    .action(async (opts: { workspaceId?: string; limit: string; page: string }) => {
      const format = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      try {
        const { workspaceId, limit, page } = DocsListOptionsSchema.parse(opts);
        const client = clientFactory();
        const data = await fetchDocs(client, { workspaceId, limit, page });
        if (format === 'table') {
          printTable(
            ['ID', 'Name', 'Kind', 'Created At', 'URL'],
            data.docs.map((d) => [d.id, d.name, d.doc_kind, d.created_at, d.url])
          );
        } else {
          printJson(data.docs);
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.error(chalk.red('Validation error: ' + err.issues.map((i) => i.message).join(', ')));
          process.exit(1);
        }
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });

  docs
    .command('create')
    .description('Create a new doc in a workspace')
    .requiredOption('--workspace-id <id>', 'Workspace ID')
    .requiredOption('--name <name>', 'Doc name')
    .option('--kind <kind>', 'Doc kind: public, private, or share', 'public')
    .option('--content <markdown>', 'Initial markdown content to add after creation')
    .option('--folder-id <id>', 'Place doc inside a specific folder')
    .action(async (opts: { workspaceId: string; name: string; kind: string; content?: string; folderId?: string }) => {
      try {
        const validated = DocCreateOptionsSchema.parse(opts);
        const client = clientFactory();
        const result = await createDoc(client, validated);
        const doc = result.create_doc;

        if (validated.content) {
          const contentResult = await addContentToDoc(client, doc.id, validated.content);
          if (!contentResult.add_content_to_doc_from_markdown.success) {
            console.error(chalk.yellow(`Doc created but content failed: ${contentResult.add_content_to_doc_from_markdown.error ?? 'unknown'}`));
          }
        }

        printJson({ id: doc.id, name: doc.name, url: doc.url });
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.error(chalk.red('Validation error: ' + err.issues.map((i) => i.message).join(', ')));
          process.exit(1);
        }
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });

  docs
    .command('content <docId> <markdown>')
    .description('Add markdown content to an existing doc')
    .action(async (docId: string, markdown: string) => {
      try {
        const client = clientFactory();
        const result = await addContentToDoc(client, docId, markdown);
        const r = result.add_content_to_doc_from_markdown;
        if (!r.success) {
          console.error(chalk.red(`Failed to add content: ${r.error ?? 'unknown'}`));
          process.exit(1);
        }
        printJson({ success: true, doc_id: docId, block_ids: r.block_ids });
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}
