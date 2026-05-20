# mcli — monday.com CLI

A TypeScript CLI for monday.com's GraphQL API.

## Installation

```bash
npm install
npm run build
npm install -g .
```

Or run without installing:

```bash
node dist/index.js <command>
```

## Authentication

```bash
mcli auth login --token YOUR_MONDAY_API_TOKEN
mcli auth status   # verify token, shows current user
mcli auth logout   # remove token from .env
```

Your token is stored in `.env` in the project directory. You can also set `MONDAY_TOKEN` as an environment variable directly.

Get your API token from monday.com: **Avatar → Administration → Connections → Personal API Token**.

## Commands

### User

```bash
mcli me
mcli me --table
```

### Workspaces

```bash
mcli workspaces
mcli workspaces --limit 10 --page 2
```

### Boards

```bash
mcli boards
mcli boards --workspace-id 12345
mcli boards get <boardId>
```

### Items

```bash
mcli items list <boardId>
mcli items list <boardId> --columns          # include column values
mcli items list <boardId> --limit 50 --cursor <cursor>

mcli items create <boardId> --name "My Task"
mcli items create <boardId> --name "My Task" --group-id grp1 --column-values '{"status": "Done"}'

mcli items update-columns <boardId> <itemId> '{"status": "In Progress"}'
```

### Updates (Comments)

```bash
mcli updates create <itemId> "This is a comment"
```

### Raw GraphQL

```bash
mcli graphql '{ me { id name email } }'
mcli graphql 'query { boards(limit: 5) { id name } }'
mcli graphql 'query GetBoard($id: ID!) { boards(ids: [$id]) { id name } }' --variables '{"id": "12345"}'
```

## Output

All commands output JSON by default. Add `--table` for human-readable tables:

```bash
mcli boards --table
mcli items list <boardId> --table
mcli workspaces --table
```

## Development

```bash
npm run build          # compile TypeScript
npm test               # run all tests
npx jest --testPathPattern=boards   # run a specific module's tests
npm run dev            # run via ts-node (no build step)
```

## Configuration

| Variable | Description | Default |
|---|---|---|
| `MONDAY_TOKEN` | API token (required) | — |
| `API_VERSION` | monday.com API version | `2026-07` |

Set via `.env` file or environment variable.
