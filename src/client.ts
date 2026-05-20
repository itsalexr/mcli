import { GraphQLClient, ClientError } from 'graphql-request';
import type { Config } from './config';

export function createClient(config: Config): GraphQLClient {
  return new GraphQLClient(config.endpoint, {
    headers: {
      Authorization: config.token,
      'API-Version': config.apiVersion,
    },
  });
}

export async function gqlRequest<T>(
  client: GraphQLClient,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  try {
    return await client.request<T>(query, variables);
  } catch (error) {
    if (error instanceof ClientError && error.response?.errors?.length) {
      throw new Error(error.response.errors.map((e) => e.message).join('; '));
    }
    throw error;
  }
}
