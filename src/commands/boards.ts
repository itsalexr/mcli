import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printTable, printJson, OutputFormat } from '../output';
import { LIST_BOARDS_QUERY, GET_BOARD_INFO_QUERY } from '../queries/boards';

export interface BoardsListResult {
  boards: Array<{
    id: string;
    name: string;
    description: string | null;
    state: string;
    board_kind: string;
    workspace: { id: string; name: string } | null;
  }>;
}

export interface BoardInfoResult {
  boards: Array<{
    id: string;
    name: string;
    description: string | null;
    state: string;
    board_kind: string;
    columns: Array<{ id: string; title: string; type: string }>;
    groups: Array<{ id: string; title: string }>;
    workspace: { id: string; name: string } | null;
  }>;
}

export async function fetchBoards(
  client: GraphQLClient,
  opts: { limit: number; page: number; workspaceId?: string }
): Promise<BoardsListResult> {
  return gqlRequest<BoardsListResult>(client, LIST_BOARDS_QUERY, {
    limit: opts.limit,
    page: opts.page,
    workspaceIds: opts.workspaceId ? [opts.workspaceId] : undefined,
  });
}

export async function fetchBoardInfo(
  client: GraphQLClient,
  boardId: string
): Promise<BoardInfoResult> {
  return gqlRequest<BoardInfoResult>(client, GET_BOARD_INFO_QUERY, { boardId });
}

function printBoardInfo(board: BoardInfoResult['boards'][0], format: OutputFormat): void {
  if (format === 'json') {
    printJson(board);
    return;
  }
  printTable(
    ['ID', 'Name', 'State', 'Kind', 'Workspace'],
    [[board.id, board.name, board.state, board.board_kind, board.workspace?.name ?? '']]
  );
  printTable(
    ['Column ID', 'Title', 'Type'],
    board.columns.map((c) => [c.id, c.title, c.type])
  );
  printTable(
    ['Group ID', 'Title'],
    board.groups.map((g) => [g.id, g.title])
  );
}

const BoardsListOptionsSchema = z.object({
  workspaceId: z.string().optional(),
  limit: z.coerce.number().int().positive().default(50),
  page: z.coerce.number().int().positive().default(1),
});

export function registerBoards(program: Command, clientFactory: () => GraphQLClient): void {
  const boards = program.command('boards').description('Manage monday.com boards');

  boards
    .command('list', { isDefault: true })
    .description('List boards')
    .option('--workspace-id <id>', 'Filter by workspace ID')
    .option('--limit <n>', 'Number of boards to return', '50')
    .option('--page <n>', 'Page number', '1')
    .action(async (opts: { workspaceId?: string; limit: string; page: string }) => {
      const format: OutputFormat = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      try {
        const { workspaceId, limit, page } = BoardsListOptionsSchema.parse(opts);
        const client = clientFactory();
        const data = await fetchBoards(client, { limit, page, workspaceId });
        if (format === 'table') {
          printTable(
            ['ID', 'Name', 'State', 'Kind', 'Workspace'],
            data.boards.map((b) => [b.id, b.name, b.state, b.board_kind, b.workspace?.name ?? ''])
          );
        } else {
          printJson(data.boards);
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

  boards
    .command('get <boardId>')
    .description('Get detailed board info')
    .action(async (boardId: string) => {
      const format: OutputFormat = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      try {
        const client = clientFactory();
        const data = await fetchBoardInfo(client, boardId);
        if (data.boards.length === 0) {
          console.error(chalk.red(`Board ${boardId} not found`));
          process.exit(1);
        }
        printBoardInfo(data.boards[0], format);
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}
