import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printJson, printTable, OutputFormat } from '../output';
import { LIST_USERS_QUERY } from '../queries/users';

export interface UsersListResult {
  users: Array<{
    id: string;
    name: string;
    email: string;
    title: string | null;
    is_admin: boolean;
    is_guest: boolean;
  }>;
}

export async function fetchUsers(
  client: GraphQLClient,
  opts: { limit: number; page: number }
): Promise<UsersListResult> {
  return gqlRequest<UsersListResult>(client, LIST_USERS_QUERY, { limit: opts.limit, page: opts.page });
}

const UsersListOptionsSchema = z.object({
  limit: z.coerce.number().int().positive().default(200),
  page: z.coerce.number().int().positive().default(1),
});

export function registerUsers(program: Command, clientFactory: () => GraphQLClient): void {
  const users = program.command('users').description('Manage monday.com users');

  users
    .command('list', { isDefault: true })
    .description('List users in the account')
    .option('--limit <n>', 'Number of users to return', '200')
    .option('--page <n>', 'Page number', '1')
    .action(async (opts: { limit: string; page: string }) => {
      const format: OutputFormat = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      try {
        const { limit, page } = UsersListOptionsSchema.parse(opts);
        const client = clientFactory();
        const data = await fetchUsers(client, { limit, page });
        if (format === 'table') {
          printTable(
            ['ID', 'Name', 'Email', 'Title', 'Admin'],
            data.users.map((u) => [u.id, u.name, u.email, u.title ?? '', u.is_admin ? 'yes' : 'no'])
          );
        } else {
          printJson(data.users);
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
