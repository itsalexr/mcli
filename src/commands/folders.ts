import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printJson } from '../output';
import { CREATE_FOLDER_MUTATION } from '../queries/folders';

export interface CreateFolderResult {
  create_folder: { id: string; name: string };
}

export async function createFolder(
  client: GraphQLClient,
  opts: { workspaceId: string; name: string; color?: string }
): Promise<CreateFolderResult> {
  return gqlRequest<CreateFolderResult>(client, CREATE_FOLDER_MUTATION, {
    workspaceId: opts.workspaceId,
    name: opts.name,
    color: opts.color,
  });
}

const FolderCreateOptionsSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  name: z.string().min(1, 'Folder name is required'),
  color: z.string().optional(),
});

export function registerFolders(program: Command, clientFactory: () => GraphQLClient): void {
  const folders = program.command('folders').description('Manage monday.com folders');

  folders
    .command('create')
    .description('Create a new folder in a workspace')
    .requiredOption('--workspace-id <id>', 'Workspace ID')
    .requiredOption('--name <name>', 'Folder name')
    .option('--color <color>', 'Folder color (e.g. bright-red, dark-blue)')
    .action(async (opts: { workspaceId: string; name: string; color?: string }) => {
      try {
        const validated = FolderCreateOptionsSchema.parse(opts);
        const client = clientFactory();
        const result = await createFolder(client, validated);
        printJson(result.create_folder);
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
