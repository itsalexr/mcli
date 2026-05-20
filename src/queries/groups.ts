import { gql } from 'graphql-request';

export const CREATE_GROUP_MUTATION = gql`
  mutation createGroup($boardId: ID!, $groupName: String!, $groupColor: String) {
    create_group(board_id: $boardId, group_name: $groupName, group_color: $groupColor) {
      id
      title
    }
  }
`;
