import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printJson } from '../output';

const isValidJson = (v: string | undefined) => {
  if (!v) return true;
  try {
    JSON.parse(v);
    return true;
  } catch {
    return false;
  }
};

const GraphqlCmdSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  variables: z
    .string()
    .optional()
    .refine(isValidJson, { message: '--variables must be valid JSON' }),
});

export async function runRawGraphql(
  client: GraphQLClient,
  query: string,
  variablesJson?: string
): Promise<unknown> {
  if (variablesJson !== undefined) {
    // Validate JSON before sending
    GraphqlCmdSchema.parse({ query, variables: variablesJson });
  }
  const variables = variablesJson ? JSON.parse(variablesJson) : undefined;
  return gqlRequest<unknown>(client, query, variables);
}

export function registerGraphql(program: Command, clientFactory: () => GraphQLClient): void {
  program
    .command('graphql <query>')
    .description('Execute a raw GraphQL query or mutation')
    .option('--variables <json>', 'Variables as JSON string')
    .action(async (query: string, opts: { variables?: string }) => {
      try {
        GraphqlCmdSchema.parse({ query, variables: opts.variables });
        const client = clientFactory();
        const result = await runRawGraphql(client, query, opts.variables);
        printJson(result);
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
