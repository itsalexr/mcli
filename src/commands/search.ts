import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printJson, printTable, OutputFormat } from '../output';
import { LIST_BOARDS_QUERY } from '../queries/boards';

interface BoardsResult {
  boards: Array<{ id: string; name: string; board_kind: string; workspace: { name: string } | null }>;
}

export async function searchBoards(
  client: GraphQLClient,
  term: string
): Promise<BoardsResult['boards']> {
  const data = await gqlRequest<BoardsResult>(client, LIST_BOARDS_QUERY, { limit: 500, page: 1 });
  const lower = term.toLowerCase();
  return data.boards.filter((b) => b.name.toLowerCase().includes(lower));
}

export function registerSearch(program: Command, clientFactory: () => GraphQLClient): void {
  program
    .command('search <term>')
    .description('Search boards by name (case-insensitive substring match)')
    .action(async (term: string) => {
      const format: OutputFormat = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      try {
        const client = clientFactory();
        const results = await searchBoards(client, term);
        if (format === 'table') {
          printTable(
            ['ID', 'Name', 'Kind', 'Workspace'],
            results.map((b) => [b.id, b.name, b.board_kind, b.workspace?.name ?? ''])
          );
        } else {
          printJson(results);
        }
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}
