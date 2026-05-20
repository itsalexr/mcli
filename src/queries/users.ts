import { gql } from 'graphql-request';

export const LIST_USERS_QUERY = gql`
  query listUsers($limit: Int) {
    users(limit: $limit) {
      id
      name
      email
      title
      is_admin
      is_guest
    }
  }
`;
