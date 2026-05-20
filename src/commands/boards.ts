import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printTable, printJson, OutputFormat } from '../output';
import {
  LIST_BOARDS_QUERY,
  GET_BOARD_INFO_QUERY,
  GET_BOARD_SCHEMA_QUERY,
  CREATE_BOARD_MUTATION,
  GET_BOARD_ACTIVITY_QUERY,
} from '../queries/boards';

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

export interface BoardSchemaResult {
  boards: Array<{
    columns: Array<{ id: string; title: string; type: string }>;
    groups: Array<{ id: string; title: string }>;
  }>;
}

export interface CreateBoardResult {
  create_board: { id: string; name: string; url: string };
}

export interface BoardActivityResult {
  boards: Array<{
    activity_logs: Array<{
      user_id: string;
      event: string;
      entity: string;
      created_at: string;
    }>;
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

export async function fetchBoardSchema(
  client: GraphQLClient,
  boardId: string
): Promise<BoardSchemaResult> {
  return gqlRequest<BoardSchemaResult>(client, GET_BOARD_SCHEMA_QUERY, { boardId });
}

export async function createBoard(
  client: GraphQLClient,
  opts: { name: string; kind: string; description?: string; workspaceId?: string }
): Promise<CreateBoardResult> {
  return gqlRequest<CreateBoardResult>(client, CREATE_BOARD_MUTATION, {
    boardName: opts.name,
    boardKind: opts.kind,
    boardDescription: opts.description,
    workspaceId: opts.workspaceId,
  });
}

export async function fetchBoardActivity(
  client: GraphQLClient,
  boardId: string,
  opts: { from: string; to: string; limit: number }
): Promise<BoardActivityResult> {
  return gqlRequest<BoardActivityResult>(client, GET_BOARD_ACTIVITY_QUERY, {
    boardId,
    from: opts.from,
    to: opts.to,
    limit: opts.limit,
  });
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

const BoardCreateOptionsSchema = z.object({
  name: z.string().min(1, 'Board name is required'),
  kind: z.enum(['public', 'private']).default('public'),
  description: z.string().optional(),
  workspaceId: z.string().optional(),
});

const BoardActivityOptionsSchema = z.object({
  limit: z.coerce.number().int().positive().default(50),
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

  boards
    .command('schema <boardId>')
    .description('Get board columns and groups')
    .action(async (boardId: string) => {
      const format: OutputFormat = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      try {
        const client = clientFactory();
        const data = await fetchBoardSchema(client, boardId);
        const board = data.boards[0];
        if (!board) {
          console.error(chalk.red(`Board ${boardId} not found`));
          process.exit(1);
        }
        if (format === 'table') {
          printTable(['Column ID', 'Title', 'Type'], board.columns.map((c) => [c.id, c.title, c.type]));
          printTable(['Group ID', 'Title'], board.groups.map((g) => [g.id, g.title]));
        } else {
          printJson({ columns: board.columns, groups: board.groups });
        }
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });

  boards
    .command('create')
    .description('Create a new board')
    .requiredOption('--name <name>', 'Board name')
    .option('--kind <kind>', 'Board kind: public or private', 'public')
    .option('--description <text>', 'Board description')
    .option('--workspace-id <id>', 'Workspace ID')
    .action(async (opts: { name: string; kind: string; description?: string; workspaceId?: string }) => {
      try {
        const validated = BoardCreateOptionsSchema.parse(opts);
        const client = clientFactory();
        const result = await createBoard(client, validated);
        printJson(result.create_board);
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
    .command('activity <boardId>')
    .description('Get board activity log')
    .option('--from <date>', 'Start date (ISO 8601)', () => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d.toISOString();
    })
    .option('--to <date>', 'End date (ISO 8601)', new Date().toISOString())
    .option('--limit <n>', 'Number of entries to return', '50')
    .action(async (boardId: string, opts: { from: string; to: string; limit: string }) => {
      const format: OutputFormat = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      try {
        const { limit } = BoardActivityOptionsSchema.parse({ limit: opts.limit });
        const client = clientFactory();
        const data = await fetchBoardActivity(client, boardId, { from: opts.from, to: opts.to, limit });
        const logs = data.boards[0]?.activity_logs ?? [];
        if (format === 'table') {
          printTable(
            ['Created At', 'User ID', 'Entity', 'Event'],
            logs.map((l) => [l.created_at, l.user_id, l.entity, l.event])
          );
        } else {
          printJson(logs);
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
