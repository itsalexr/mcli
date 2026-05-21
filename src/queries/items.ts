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

export const DELETE_ITEM_MUTATION = gql`
  mutation deleteItem($itemId: ID!) {
    delete_item(item_id: $itemId) {
      id
    }
  }
`;

export const MOVE_ITEM_TO_GROUP_MUTATION = gql`
  mutation moveItemToGroup($itemId: ID!, $groupId: String!) {
    move_item_to_group(item_id: $itemId, group_id: $groupId) {
      id
    }
  }
`;

export const CREATE_SUBITEM_MUTATION = gql`
  mutation createSubitem($parentItemId: ID!, $itemName: String!, $columnValues: JSON) {
    create_subitem(
      parent_item_id: $parentItemId
      item_name: $itemName
      column_values: $columnValues
    ) {
      id
      name
      url
      parent_item {
        id
      }
    }
  }
`;

export const DUPLICATE_ITEM_MUTATION = gql`
  mutation duplicateItem($boardId: ID!, $itemId: ID!, $withUpdates: Boolean) {
    duplicate_item(board_id: $boardId, item_id: $itemId, with_updates: $withUpdates) {
      id
      name
      url
    }
  }
`;
