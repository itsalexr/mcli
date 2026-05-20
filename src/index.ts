#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from './config';
import { createClient } from './client';
import { registerAuth } from './commands/auth';
import { registerMe } from './commands/me';
import { registerWorkspaces } from './commands/workspaces';
import { registerBoards } from './commands/boards';
import { registerItems } from './commands/items';
import { registerUpdates } from './commands/updates';
import { registerGraphql } from './commands/graphql';
import { registerGroups } from './commands/groups';
import { registerUsers } from './commands/users';
import { registerSearch } from './commands/search';

const program = new Command();

program
  .name('mcli')
  .description('monday.com CLI')
  .version('1.0.0')
  .option('--table', 'Output as human-readable table instead of JSON');

const clientFactory = () => createClient(loadConfig());

registerAuth(program, clientFactory);
registerMe(program, clientFactory);
registerWorkspaces(program, clientFactory);
registerBoards(program, clientFactory);
registerItems(program, clientFactory);
registerUpdates(program, clientFactory);
registerGraphql(program, clientFactory);
registerGroups(program, clientFactory);
registerUsers(program, clientFactory);
registerSearch(program, clientFactory);

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
