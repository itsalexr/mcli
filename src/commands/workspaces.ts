import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printOutput, OutputFormat } from '../output';
import { LIST_WORKSPACES_QUERY } from '../queries/workspaces';

export interface WorkspacesResult {
  workspaces: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
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

const WorkspacesOptionsSchema = z.object({
  limit: z.coerce.number().int().positive().default(50),
  page: z.coerce.number().int().positive().default(1),
});

export function registerWorkspaces(program: Command, clientFactory: () => GraphQLClient): void {
  program
    .command('workspaces')
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
}
