import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { GraphQLClient, gql } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printOutput, OutputFormat } from '../output';

const ME_QUERY = gql`
  query me {
    me {
      id
      name
      email
      title
      account {
        id
        name
      }
    }
  }
`;

interface MeResponse {
  me: {
    id: string;
    name: string;
    email: string;
    title: string | null;
    account: { id: string; name: string };
  };
}

const defaultEnvPath = path.join(process.cwd(), '.env');

export function saveToken(token: string, envPath: string = defaultEnvPath): void {
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  const lines = content.split('\n');
  const tokenLine = `MONDAY_TOKEN=${token}`;
  const idx = lines.findIndex((l) => l.startsWith('MONDAY_TOKEN='));

  if (idx >= 0) {
    lines[idx] = tokenLine;
    fs.writeFileSync(envPath, lines.join('\n'));
  } else {
    const trimmed = content.trimEnd();
    fs.writeFileSync(envPath, trimmed ? `${trimmed}\n${tokenLine}\n` : `${tokenLine}\n`);
  }
}

export function clearToken(envPath: string = defaultEnvPath): void {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  const filtered = content
    .split('\n')
    .filter((l) => !l.startsWith('MONDAY_TOKEN='))
    .join('\n');
  fs.writeFileSync(envPath, filtered);
}

export async function runAuthStatus(client: GraphQLClient, format: OutputFormat): Promise<void> {
  const data = await gqlRequest<MeResponse>(client, ME_QUERY);
  printOutput(data.me, format, (me) => ({
    headers: ['ID', 'Name', 'Email', 'Title', 'Account ID', 'Account Name'],
    rows: [[me.id, me.name, me.email ?? '', me.title ?? '', me.account.id, me.account.name]],
  }));
}

const LoginSchema = z.object({
  token: z.string().min(1, 'Token cannot be empty'),
});

export function registerAuth(program: Command, clientFactory: () => GraphQLClient): void {
  const auth = program.command('auth').description('Manage authentication');

  auth
    .command('login')
    .description('Save your monday.com API token to .env')
    .requiredOption('--token <token>', 'Monday.com API token')
    .action((opts: { token: string }) => {
      try {
        const { token } = LoginSchema.parse({ token: opts.token });
        saveToken(token);
        console.log(chalk.green('Token saved to .env'));
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.error(chalk.red('Validation error: ' + err.issues.map((i) => i.message).join(', ')));
          process.exit(1);
        }
        throw err;
      }
    });

  auth
    .command('logout')
    .description('Remove MONDAY_TOKEN from .env')
    .action(() => {
      clearToken();
      console.log(chalk.green('Token removed from .env'));
    });

  auth
    .command('status')
    .description('Verify token and show current user')
    .action(async () => {
      const format = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      try {
        const client = clientFactory();
        await runAuthStatus(client, format);
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}
