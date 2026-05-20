import { gql } from 'graphql-request';

export const ME_QUERY = gql`
  query me {
    me {
      id
      name
      email
      title
      account {
        id
        name
      }
    }
  }
`;
