import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printJson, printTable, OutputFormat } from '../output';
import { CREATE_UPDATE_MUTATION, GET_ITEM_UPDATES_QUERY } from '../queries/updates';

export interface CreateUpdateResult {
  create_update: {
    id: string;
    item_id: string;
    item: { name: string; url: string };
  };
}

export interface ItemUpdatesResult {
  items: Array<{
    id: string;
    updates: Array<{
      id: string;
      text_body: string;
      created_at: string;
      creator: { id: string; name: string } | null;
    }>;
  }>;
}

export async function createUpdate(
  client: GraphQLClient,
  itemId: string,
  body: string
): Promise<CreateUpdateResult> {
  return gqlRequest<CreateUpdateResult>(client, CREATE_UPDATE_MUTATION, { itemId, body });
}

export async function fetchUpdates(
  client: GraphQLClient,
  itemId: string,
  opts: { limit: number; page: number }
): Promise<ItemUpdatesResult> {
  return gqlRequest<ItemUpdatesResult>(client, GET_ITEM_UPDATES_QUERY, {
    itemId,
    limit: opts.limit,
    page: opts.page,
  });
}

const UpdateCreateSchema = z.object({
  itemId: z.string().min(1),
  body: z.string().min(1, 'Update body cannot be empty'),
});

const UpdatesListOptionsSchema = z.object({
  limit: z.coerce.number().int().positive().default(25),
  page: z.coerce.number().int().positive().default(1),
});

export function registerUpdates(program: Command, clientFactory: () => GraphQLClient): void {
  const updates = program.command('updates').description('Manage monday.com item updates');

  updates
    .command('create <itemId> <body>')
    .description('Add a comment/update to an item')
    .action(async (itemId: string, body: string) => {
      try {
        UpdateCreateSchema.parse({ itemId, body });
        const client = clientFactory();
        const result = await createUpdate(client, itemId, body);
        printJson(result.create_update);
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.error(chalk.red('Validation error: ' + err.issues.map((i) => i.message).join(', ')));
          process.exit(1);
        }
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });

  updates
    .command('list <itemId>')
    .description('List updates/comments on an item')
    .option('--limit <n>', 'Number of updates to return', '25')
    .option('--page <n>', 'Page number', '1')
    .action(async (itemId: string, opts: { limit: string; page: string }) => {
      const format: OutputFormat = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      try {
        const { limit, page } = UpdatesListOptionsSchema.parse(opts);
        const client = clientFactory();
        const data = await fetchUpdates(client, itemId, { limit, page });
        const updatesList = data.items[0]?.updates ?? [];
        if (format === 'table') {
          printTable(
            ['ID', 'Creator', 'Created At', 'Body'],
            updatesList.map((u) => [
              u.id,
              u.creator?.name ?? '',
              u.created_at,
              u.text_body.length > 60 ? u.text_body.slice(0, 57) + '...' : u.text_body,
            ])
          );
        } else {
          printJson(updatesList);
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
}
