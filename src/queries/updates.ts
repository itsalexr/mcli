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
