import { gql } from 'graphql-request';

export const LIST_USERS_QUERY = gql`
  query listUsers($limit: Int, $page: Int) {
    users(limit: $limit, page: $page) {
      id
      name
      email
      title
      is_admin
      is_guest
    }
  }
`;
