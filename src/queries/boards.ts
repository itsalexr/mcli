import { gql } from 'graphql-request';

export const LIST_BOARDS_QUERY = gql`
  query listBoards($limit: Int, $page: Int, $workspaceIds: [ID]) {
    boards(limit: $limit, page: $page, workspace_ids: $workspaceIds) {
      id
      name
      description
      state
      board_kind
      workspace {
        id
        name
      }
    }
  }
`;

export const GET_BOARD_INFO_QUERY = gql`
  query getBoardInfo($boardId: ID!) {
    boards(ids: [$boardId]) {
      id
      name
      description
      state
      board_kind
      columns {
        id
        title
        type
      }
      groups {
        id
        title
      }
      workspace {
        id
        name
      }
    }
  }
`;
