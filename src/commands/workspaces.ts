import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printOutput, printJson, OutputFormat } from '../output';
import { LIST_WORKSPACES_QUERY, CREATE_WORKSPACE_MUTATION } from '../queries/workspaces';

export interface WorkspacesResult {
  workspaces: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
}

export interface CreateWorkspaceResult {
  create_workspace: { id: string; name: string };
}

export async function fetchWorkspaces(
  client: GraphQLClient,
  opts: { limit: number; page: number }
): Promise<WorkspacesResult> {
  return gqlRequest<WorkspacesResult>(client, LIST_WORKSPACES_QUERY, {
    limit: opts.limit,
    page: opts.page,
  });
}

export async function createWorkspace(
  client: GraphQLClient,
  opts: { name: string; kind: string; description?: string }
): Promise<CreateWorkspaceResult> {
  return gqlRequest<CreateWorkspaceResult>(client, CREATE_WORKSPACE_MUTATION, {
    name: opts.name,
    workspaceKind: opts.kind,
    description: opts.description,
  });
}

const WorkspacesOptionsSchema = z.object({
  limit: z.coerce.number().int().positive().default(50),
  page: z.coerce.number().int().positive().default(1),
});

const WorkspaceCreateOptionsSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  kind: z.enum(['open', 'closed'], { errorMap: () => ({ message: '--kind must be open or closed' }) }),
  description: z.string().optional(),
});

export function registerWorkspaces(program: Command, clientFactory: () => GraphQLClient): void {
  const workspaces = program.command('workspaces').description('Manage monday.com workspaces');

  workspaces
    .command('list', { isDefault: true })
    .description('List monday.com workspaces')
    .option('--limit <n>', 'Number of workspaces to return', '50')
    .option('--page <n>', 'Page number', '1')
    .action(async (opts: { limit: string; page: string }) => {
      const format: OutputFormat = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      try {
        const { limit, page } = WorkspacesOptionsSchema.parse(opts);
        const client = clientFactory();
        const data = await fetchWorkspaces(client, { limit, page });
        printOutput(data.workspaces, format, (ws) => ({
          headers: ['ID', 'Name', 'Description'],
          rows: ws.map((w) => [w.id, w.name, w.description ?? '']),
        }));
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.error(chalk.red('Validation error: ' + err.issues.map((i) => i.message).join(', ')));
          process.exit(1);
        }
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });

  workspaces
    .command('create')
    .description('Create a new workspace')
    .requiredOption('--name <name>', 'Workspace name')
    .requiredOption('--kind <kind>', 'Workspace kind: open or closed')
    .option('--description <text>', 'Workspace description')
    .action(async (opts: { name: string; kind: string; description?: string }) => {
      try {
        const validated = WorkspaceCreateOptionsSchema.parse(opts);
        const client = clientFactory();
        const result = await createWorkspace(client, validated);
        printJson(result.create_workspace);
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.error(chalk.red('Validation error: ' + err.issues.map((i) => i.message).join(', ')));
          process.exit(1);
        }
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}
