import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printJson } from '../output';
import { CREATE_GROUP_MUTATION } from '../queries/groups';

export interface CreateGroupResult {
  create_group: { id: string; title: string };
}

export async function createGroup(
  client: GraphQLClient,
  boardId: string,
  opts: { name: string; color?: string }
): Promise<CreateGroupResult> {
  return gqlRequest<CreateGroupResult>(client, CREATE_GROUP_MUTATION, {
    boardId,
    groupName: opts.name,
    groupColor: opts.color,
  });
}

const GroupCreateOptionsSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  color: z.string().optional(),
});

export function registerGroups(program: Command, clientFactory: () => GraphQLClient): void {
  const groups = program.command('groups').description('Manage monday.com board groups');

  groups
    .command('create <boardId>')
    .description('Create a new group on a board')
    .requiredOption('--name <name>', 'Group name')
    .option('--color <color>', 'Group color (e.g. done, working_on_it, stuck)')
    .action(async (boardId: string, opts: { name: string; color?: string }) => {
      try {
        const validated = GroupCreateOptionsSchema.parse(opts);
        const client = clientFactory();
        const result = await createGroup(client, boardId, validated);
        printJson(result.create_group);
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
