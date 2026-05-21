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

export const CREATE_WORKSPACE_MUTATION = gql`
  mutation createWorkspace($name: String!, $workspaceKind: WorkspaceKind!, $description: String) {
    create_workspace(name: $name, kind: $workspaceKind, description: $description) {
      id
      name
    }
  }
`;
