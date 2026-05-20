import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printJson } from '../output';
import { CREATE_UPDATE_MUTATION } from '../queries/updates';

export interface CreateUpdateResult {
  create_update: {
    id: string;
    item_id: string;
    item: { name: string; url: string };
  };
}

export async function createUpdate(
  client: GraphQLClient,
  itemId: string,
  body: string
): Promise<CreateUpdateResult> {
  return gqlRequest<CreateUpdateResult>(client, CREATE_UPDATE_MUTATION, { itemId, body });
}

const UpdateCreateSchema = z.object({
  itemId: z.string().min(1),
  body: z.string().min(1, 'Update body cannot be empty'),
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
}
