import { GraphQLClient } from 'graphql-request';

export function createMockClient() {
  const mockRequest = jest.fn();
  const client = { request: mockRequest } as unknown as GraphQLClient;

  return {
    client,
    request: mockRequest,
    setResponse: <T>(data: T) => mockRequest.mockResolvedValue(data),
    setError: (msg: string) => {
      const err = new Error(msg);
      mockRequest.mockRejectedValue(err);
    },
  };
}
