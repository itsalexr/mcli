import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printJson, printTable, OutputFormat } from '../output';
import { LIST_BOARDS_QUERY } from '../queries/boards';
import { LIST_DOCS_QUERY } from '../queries/docs';

interface BoardsResult {
  boards: Array<{ id: string; name: string; board_kind: string; workspace: { name: string } | null }>;
}

interface DocsResult {
  docs: Array<{ id: string; name: string; url: string }>;
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'board' | 'doc';
  url?: string;
  kind?: string;
  workspace?: string;
}

export async function searchBoards(
  client: GraphQLClient,
  term: string
): Promise<BoardsResult['boards']> {
  const data = await gqlRequest<BoardsResult>(client, LIST_BOARDS_QUERY, { limit: 500, page: 1 });
  const lower = term.toLowerCase();
  return data.boards.filter((b) => b.name.toLowerCase().includes(lower));
}

export async function searchAll(
  client: GraphQLClient,
  term: string,
  type: 'boards' | 'docs' | 'all'
): Promise<SearchResult[]> {
  const lower = term.toLowerCase();
  const results: SearchResult[] = [];

  if (type === 'boards' || type === 'all') {
    const data = await gqlRequest<BoardsResult>(client, LIST_BOARDS_QUERY, { limit: 500, page: 1 });
    for (const b of data.boards) {
      if (b.name.toLowerCase().includes(lower)) {
        results.push({ id: b.id, name: b.name, type: 'board', kind: b.board_kind, workspace: b.workspace?.name });
      }
    }
  }

  if (type === 'docs' || type === 'all') {
    const data = await gqlRequest<DocsResult>(client, LIST_DOCS_QUERY, { limit: 500, page: 1 });
    for (const d of data.docs) {
      if (d.name.toLowerCase().includes(lower)) {
        results.push({ id: d.id, name: d.name, type: 'doc', url: d.url });
      }
    }
  }

  return results;
}

export function registerSearch(program: Command, clientFactory: () => GraphQLClient): void {
  program
    .command('search <term>')
    .description('Search boards and docs by name (case-insensitive substring match)')
    .option('--type <type>', 'What to search: boards, docs, or all (default: boards)', 'boards')
    .action(async (term: string, opts: { type: string }) => {
      const format: OutputFormat = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      const searchType = opts.type as 'boards' | 'docs' | 'all';
      try {
        const client = clientFactory();

        if (searchType === 'boards') {
          const results = await searchBoards(client, term);
          if (format === 'table') {
            printTable(
              ['ID', 'Name', 'Kind', 'Workspace'],
              results.map((b) => [b.id, b.name, b.board_kind, b.workspace?.name ?? ''])
            );
          } else {
            printJson(results);
          }
        } else {
          const results = await searchAll(client, term, searchType);
          if (format === 'table') {
            printTable(
              ['Type', 'ID', 'Name', 'Kind/URL'],
              results.map((r) => [r.type, r.id, r.name, r.kind ?? r.url ?? ''])
            );
          } else {
            printJson(results);
          }
        }
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}
