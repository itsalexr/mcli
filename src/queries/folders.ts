import { gql } from 'graphql-request';

export const CREATE_FOLDER_MUTATION = gql`
  mutation createFolder($workspaceId: ID!, $name: String!, $color: FolderColor) {
    create_folder(workspace_id: $workspaceId, name: $name, color: $color) {
      id
      name
    }
  }
`;
