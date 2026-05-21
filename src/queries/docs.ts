import { gql } from 'graphql-request';

export const LIST_DOCS_QUERY = gql`
  query listDocs($ids: [ID!], $workspace_ids: [ID], $limit: Int, $page: Int) {
    docs(ids: $ids, workspace_ids: $workspace_ids, limit: $limit, page: $page) {
      id
      name
      doc_kind
      created_at
      url
      workspace_id
      doc_folder_id
      created_by {
        id
        name
      }
    }
  }
`;

export const CREATE_DOC_MUTATION = gql`
  mutation createDoc($location: CreateDocInput!) {
    create_doc(location: $location) {
      id
      object_id
      url
      name
    }
  }
`;

export const ADD_CONTENT_TO_DOC_MUTATION = gql`
  mutation addContentToDocFromMarkdown($docId: ID!, $markdown: String!) {
    add_content_to_doc_from_markdown(docId: $docId, markdown: $markdown) {
      success
      block_ids
      error
    }
  }
`;
