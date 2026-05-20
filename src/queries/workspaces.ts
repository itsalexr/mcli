import { gql } from 'graphql-request';

export const LIST_WORKSPACES_QUERY = gql`
  query listWorkspaces($limit: Int, $page: Int) {
    workspaces(limit: $limit, page: $page, membership_kind: member) {
      id
      name
      description
    }
  }
`;
