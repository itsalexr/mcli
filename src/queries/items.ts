import { gql } from 'graphql-request';

export const GET_BOARD_ITEMS_PAGE_QUERY = gql`
  query getBoardItemsPage(
    $boardId: ID!
    $limit: Int
    $cursor: String
    $includeColumns: Boolean!
  ) {
    boards(ids: [$boardId]) {
      items_page(limit: $limit, cursor: $cursor) {
        items {
          id
          name
          url
          created_at
          updated_at
          column_values @include(if: $includeColumns) {
            id
            type
            text
            value
          }
        }
        cursor
      }
    }
  }
`;

export const CREATE_ITEM_MUTATION = gql`
  mutation createItem(
    $boardId: ID!
    $itemName: String!
    $groupId: String
    $columnValues: JSON
  ) {
    create_item(
      board_id: $boardId
      item_name: $itemName
      group_id: $groupId
      column_values: $columnValues
    ) {
      id
      name
      url
    }
  }
`;

export const CHANGE_ITEM_COLUMN_VALUES_MUTATION = gql`
  mutation changeItemColumnValues($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
    change_multiple_column_values(
      board_id: $boardId
      item_id: $itemId
      column_values: $columnValues
    ) {
      id
      name
      url
    }
  }
`;
