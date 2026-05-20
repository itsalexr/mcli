import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printOutput, OutputFormat } from '../output';
import { ME_QUERY } from '../queries/me';

export interface MeResult {
  me: {
    id: string;
    name: string;
    email: string;
    title: string | null;
    account: { id: string; name: string };
  };
}

export async function fetchMe(client: GraphQLClient): Promise<MeResult> {
  return gqlRequest<MeResult>(client, ME_QUERY);
}

export function registerMe(program: Command, clientFactory: () => GraphQLClient): void {
  program
    .command('me')
    .description('Show current authenticated user')
    .action(async () => {
      const format: OutputFormat = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      try {
        const client = clientFactory();
        const data = await fetchMe(client);
        printOutput(data.me, format, (me) => ({
          headers: ['ID', 'Name', 'Email', 'Title', 'Account ID', 'Account Name'],
          rows: [[me.id, me.name, me.email, me.title ?? '', me.account.id, me.account.name]],
        }));
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}
