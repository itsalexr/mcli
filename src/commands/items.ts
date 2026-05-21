import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printTable, printJson, OutputFormat } from '../output';
import {
  GET_BOARD_ITEMS_PAGE_QUERY,
  CREATE_ITEM_MUTATION,
  CHANGE_ITEM_COLUMN_VALUES_MUTATION,
  DELETE_ITEM_MUTATION,
  MOVE_ITEM_TO_GROUP_MUTATION,
  CREATE_SUBITEM_MUTATION,
  DUPLICATE_ITEM_MUTATION,
} from '../queries/items';

export interface ItemsPageResult {
  boards: Array<{
    items_page: {
      items: Array<{
        id: string;
        name: string;
        url: string;
        created_at: string;
        updated_at: string;
        column_values: Array<{ id: string; type: string; text: string; value: string }>;
      }>;
      cursor: string | null;
    };
  }>;
}

export interface CreateItemResult {
  create_item: { id: string; name: string; url: string };
}

export interface UpdateColumnsResult {
  change_multiple_column_values: { id: string; name: string; url: string };
}

export interface DeleteItemResult {
  delete_item: { id: string };
}

export interface MoveItemResult {
  move_item_to_group: { id: string };
}

export interface CreateSubitemResult {
  create_subitem: { id: string; name: string; url: string; parent_item: { id: string } };
}

export interface DuplicateItemResult {
  duplicate_item: { id: string; name: string; url: string };
}

export async function fetchItems(
  client: GraphQLClient,
  boardId: string,
  opts: { limit: number; includeColumns: boolean; cursor?: string }
): Promise<ItemsPageResult> {
  return gqlRequest<ItemsPageResult>(client, GET_BOARD_ITEMS_PAGE_QUERY, {
    boardId,
    limit: opts.limit,
    cursor: opts.cursor,
    includeColumns: opts.includeColumns,
  });
}

export async function createItem(
  client: GraphQLClient,
  boardId: string,
  opts: { name: string; groupId?: string; columnValues?: string }
): Promise<CreateItemResult> {
  return gqlRequest<CreateItemResult>(client, CREATE_ITEM_MUTATION, {
    boardId,
    itemName: opts.name,
    groupId: opts.groupId,
    columnValues: opts.columnValues,
  });
}

export async function updateItemColumns(
  client: GraphQLClient,
  boardId: string,
  itemId: string,
  columnValuesJson: string
): Promise<UpdateColumnsResult> {
  return gqlRequest<UpdateColumnsResult>(client, CHANGE_ITEM_COLUMN_VALUES_MUTATION, {
    boardId,
    itemId,
    columnValues: columnValuesJson,
  });
}

export async function deleteItem(
  client: GraphQLClient,
  itemId: string
): Promise<DeleteItemResult> {
  return gqlRequest<DeleteItemResult>(client, DELETE_ITEM_MUTATION, { itemId });
}

export async function moveItemToGroup(
  client: GraphQLClient,
  itemId: string,
  groupId: string
): Promise<MoveItemResult> {
  return gqlRequest<MoveItemResult>(client, MOVE_ITEM_TO_GROUP_MUTATION, { itemId, groupId });
}

export async function createSubitem(
  client: GraphQLClient,
  parentItemId: string,
  opts: { name: string; columnValues?: string }
): Promise<CreateSubitemResult> {
  return gqlRequest<CreateSubitemResult>(client, CREATE_SUBITEM_MUTATION, {
    parentItemId,
    itemName: opts.name,
    columnValues: opts.columnValues,
  });
}

export async function duplicateItem(
  client: GraphQLClient,
  boardId: string,
  itemId: string,
  withUpdates?: boolean
): Promise<DuplicateItemResult> {
  return gqlRequest<DuplicateItemResult>(client, DUPLICATE_ITEM_MUTATION, { boardId, itemId, withUpdates });
}

const isValidJson = (v: string | undefined) => {
  if (!v) return true;
  try {
    JSON.parse(v);
    return true;
  } catch {
    return false;
  }
};

const ItemsListOptionsSchema = z.object({
  limit: z.coerce.number().int().positive().default(25),
  cursor: z.string().optional(),
  columns: z.boolean().optional(),
});

const ItemCreateOptionsSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  groupId: z.string().optional(),
  columnValues: z
    .string()
    .optional()
    .refine(isValidJson, { message: '--column-values must be valid JSON' }),
});

const UpdateColumnsSchema = z.object({
  columnValuesJson: z
    .string()
    .refine(isValidJson, { message: 'columnValuesJson must be valid JSON' }),
});

const SubitemCreateOptionsSchema = z.object({
  name: z.string().min(1, 'Subitem name is required'),
  columnValues: z
    .string()
    .optional()
    .refine(isValidJson, { message: '--column-values must be valid JSON' }),
});

function formatColumnValues(
  cvs: Array<{ id: string; type: string; text: string; value: string }>
): string {
  return cvs
    .filter((cv) => cv.text)
    .map((cv) => `${cv.id}=${cv.text}`)
    .join(', ');
}

export function registerItems(program: Command, clientFactory: () => GraphQLClient): void {
  const items = program.command('items').description('Manage monday.com items');

  items
    .command('list <boardId>')
    .description('List items on a board')
    .option('--limit <n>', 'Number of items to return', '25')
    .option('--cursor <cursor>', 'Pagination cursor')
    .option('--columns', 'Include column values')
    .action(async (boardId: string, opts: { limit: string; cursor?: string; columns?: boolean }) => {
      const format: OutputFormat = (program.opts().table as boolean | undefined) ? 'table' : 'json';
      try {
        const { limit, cursor, columns } = ItemsListOptionsSchema.parse(opts);
        const client = clientFactory();
        const data = await fetchItems(client, boardId, {
          limit,
          cursor,
          includeColumns: columns ?? false,
        });
        const itemList = data.boards[0]?.items_page.items ?? [];
        const nextCursor = data.boards[0]?.items_page.cursor;

        if (format === 'table') {
          const headers = ['ID', 'Name', 'Created', 'Updated', 'URL'];
          if (columns) headers.push('Column Values');
          printTable(
            headers,
            itemList.map((item) => {
              const row: (string | null)[] = [
                item.id,
                item.name,
                item.created_at,
                item.updated_at,
                item.url,
              ];
              if (columns) row.push(formatColumnValues(item.column_values));
              return row;
            })
          );
          if (nextCursor) {
            console.log(chalk.gray(`Next cursor: ${nextCursor}`));
          }
        } else {
          printJson({ items: itemList, cursor: nextCursor });
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

  items
    .command('create <boardId>')
    .description('Create a new item on a board')
    .requiredOption('--name <name>', 'Item name')
    .option('--group-id <id>', 'Group ID')
    .option('--column-values <json>', 'Column values as JSON string')
    .action(async (boardId: string, opts: { name: string; groupId?: string; columnValues?: string }) => {
      try {
        const validated = ItemCreateOptionsSchema.parse({
          name: opts.name,
          groupId: opts.groupId,
          columnValues: opts.columnValues,
        });
        const client = clientFactory();
        const result = await createItem(client, boardId, validated);
        printJson(result.create_item);
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.error(chalk.red('Validation error: ' + err.issues.map((i) => i.message).join(', ')));
          process.exit(1);
        }
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });

  items
    .command('update-columns <boardId> <itemId> <columnValuesJson>')
    .description('Update column values for an item')
    .action(async (boardId: string, itemId: string, columnValuesJson: string) => {
      try {
        UpdateColumnsSchema.parse({ columnValuesJson });
        const client = clientFactory();
        const result = await updateItemColumns(client, boardId, itemId, columnValuesJson);
        printJson(result.change_multiple_column_values);
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.error(chalk.red('Validation error: ' + err.issues.map((i) => i.message).join(', ')));
          process.exit(1);
        }
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });

  items
    .command('delete <itemId>')
    .description('Delete an item')
    .action(async (itemId: string) => {
      try {
        const client = clientFactory();
        const result = await deleteItem(client, itemId);
        printJson({ deleted: true, id: result.delete_item.id });
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });

  items
    .command('move <itemId>')
    .description('Move an item to a different group')
    .requiredOption('--group <groupId>', 'Target group ID')
    .action(async (itemId: string, opts: { group: string }) => {
      try {
        const client = clientFactory();
        const result = await moveItemToGroup(client, itemId, opts.group);
        printJson({ moved: true, id: result.move_item_to_group.id, groupId: opts.group });
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });

  items
    .command('subitem <parentItemId>')
    .description('Create a subitem under a parent item')
    .requiredOption('--name <name>', 'Subitem name')
    .option('--column-values <json>', 'Column values as JSON string')
    .action(async (parentItemId: string, opts: { name: string; columnValues?: string }) => {
      try {
        const validated = SubitemCreateOptionsSchema.parse(opts);
        const client = clientFactory();
        const result = await createSubitem(client, parentItemId, validated);
        const s = result.create_subitem;
        printJson({ id: s.id, name: s.name, url: s.url, parent_item_id: s.parent_item.id });
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.error(chalk.red('Validation error: ' + err.issues.map((i) => i.message).join(', ')));
          process.exit(1);
        }
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });

  items
    .command('duplicate <boardId> <itemId>')
    .description('Duplicate an item')
    .option('--with-updates', 'Also copy item updates/comments')
    .action(async (boardId: string, itemId: string, opts: { withUpdates?: boolean }) => {
      try {
        const client = clientFactory();
        const result = await duplicateItem(client, boardId, itemId, opts.withUpdates);
        printJson(result.duplicate_item);
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}
