import { gql } from 'graphql-request';

export const CREATE_UPDATE_MUTATION = gql`
  mutation createUpdate($itemId: ID!, $body: String!) {
    create_update(body: $body, item_id: $itemId) {
      id
      item_id
      item {
        name
        url
      }
    }
  }
`;

export const GET_ITEM_UPDATES_QUERY = gql`
  query getItemUpdates($itemId: ID!, $limit: Int, $page: Int) {
    items(ids: [$itemId]) {
      id
      updates(limit: $limit, page: $page) {
        id
        text_body
        created_at
        creator {
          id
          name
        }
      }
    }
  }
`;
