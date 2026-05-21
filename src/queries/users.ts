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

export const LIST_TEAMS_QUERY = gql`
  query listTeams($limit: Int) {
    teams(limit: $limit) {
      id
      name
      is_guest
      picture_url
      users {
        id
        name
        email
      }
    }
  }
`;
