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

export const GET_BOARD_SCHEMA_QUERY = gql`
  query getBoardSchema($boardId: ID!) {
    boards(ids: [$boardId]) {
      columns {
        id
        title
        type
      }
      groups {
        id
        title
      }
    }
  }
`;

export const CREATE_BOARD_MUTATION = gql`
  mutation createBoard(
    $boardName: String!
    $boardKind: BoardKind!
    $boardDescription: String
    $workspaceId: ID
  ) {
    create_board(
      board_name: $boardName
      board_kind: $boardKind
      description: $boardDescription
      workspace_id: $workspaceId
    ) {
      id
      name
      url
    }
  }
`;

export const GET_BOARD_ACTIVITY_QUERY = gql`
  query getBoardActivity($boardId: ID!, $from: ISO8601DateTime!, $to: ISO8601DateTime!, $limit: Int) {
    boards(ids: [$boardId]) {
      activity_logs(from: $from, to: $to, limit: $limit) {
        user_id
        event
        entity
        created_at
      }
    }
  }
`;
