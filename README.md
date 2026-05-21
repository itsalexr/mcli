# mcli — monday.com CLI

> Fresh out of a coding agent. Bugs are expected — [open an issue](https://github.com/itsalexr/mcli/issues) if you hit one.

A CLI for monday.com's GraphQL API. Works standalone or as a skill inside Claude Code and other coding agents.

## Install via agent (recommended)

Paste this as a message to your agent and it will set itself up:

> Set up the monday.com skill for this project. Add the following to this project's agent context file (e.g. `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.cursor/rules`, or `.github/copilot-instructions.md` — whichever applies to you):
>
> ```
> ## monday.com
> Use `npx @itsalexr/mcli` to interact with monday.com. No install needed.
> Set MONDAY_TOKEN env var for auth, or run `npx @itsalexr/mcli auth login` once.
>
> Key commands:
> - `npx @itsalexr/mcli boards list [--workspace-id <id>]`
> - `npx @itsalexr/mcli boards schema <boardId>` — columns and groups
> - `npx @itsalexr/mcli boards columns create <boardId> --type text --title "Notes"`
> - `npx @itsalexr/mcli items list <boardId> [--columns] [--table]`
> - `npx @itsalexr/mcli items create <boardId> --name "Task"`
> - `npx @itsalexr/mcli items subitem <parentItemId> --name "Sub-task"`
> - `npx @itsalexr/mcli items duplicate <boardId> <itemId>`
> - `npx @itsalexr/mcli items delete <itemId>`
> - `npx @itsalexr/mcli updates list <itemId>` — read comments
> - `npx @itsalexr/mcli updates create <itemId> "comment text"`
> - `npx @itsalexr/mcli docs list [--workspace-id <id>]`
> - `npx @itsalexr/mcli docs create --workspace-id <id> --name "My Doc"`
> - `npx @itsalexr/mcli users list`
> - `npx @itsalexr/mcli users teams`
> - `npx @itsalexr/mcli search "term" [--type boards|docs|all]`
> - `npx @itsalexr/mcli graphql '<query>'`
> ```
>
> Then check whether `MONDAY_TOKEN` is set in the environment. If not, run `npx @itsalexr/mcli auth login` so I can authenticate.

## Install manually

```bash
npm install -g @itsalexr/mcli
```

Or run without installing:

```bash
npx @itsalexr/mcli boards list
```

## Authentication

Get your API token: **monday.com → Avatar → Administration → Connections → Personal API Token**

```bash
mcli auth login    # interactive setup, saves token to ~/.env
mcli auth status   # verify token and show current user
mcli auth logout   # remove stored token
```

Or set the environment variable directly:

```bash
export MONDAY_TOKEN=your_token_here
```

## Commands

### User & workspaces

```bash
mcli me
mcli workspaces
mcli workspaces --limit 10 --page 2
mcli workspaces create --name "My Workspace" --kind open   # kind: open or closed
```

### Boards

```bash
mcli boards list
mcli boards list --workspace-id 12345
mcli boards get <boardId>
mcli boards schema <boardId>                                # columns and groups only
mcli boards create --name "My Board"                        # kind: public (default), private, share
mcli boards activity <boardId>                              # last 30 days by default
mcli boards activity <boardId> --from 2026-01-01 --to 2026-02-01

mcli boards columns create <boardId> --type text --title "Notes"
mcli boards columns create <boardId> --type status --title "Priority" --description "Task priority"
mcli boards columns delete <boardId> <columnId>
```

### Items

```bash
mcli items list <boardId>
mcli items list <boardId> --columns          # include column values
mcli items list <boardId> --limit 50 --cursor <cursor>

mcli items create <boardId> --name "My Task"
mcli items create <boardId> --name "My Task" --group-id grp1 --column-values '{"status": "Done"}'

mcli items update-columns <boardId> <itemId> '{"status": "In Progress"}'

mcli items delete <itemId>
mcli items move <itemId> --group <groupId>
mcli items subitem <parentItemId> --name "Sub-task"         # create subitem under a parent
mcli items duplicate <boardId> <itemId>                     # duplicate an item
mcli items duplicate <boardId> <itemId> --with-updates      # also copy comments
```

### Updates (comments)

```bash
mcli updates create <itemId> "This is a comment"
mcli updates list <itemId>                   # read comments
mcli updates list <itemId> --limit 10 --page 2
```

### Groups

```bash
mcli groups create <boardId> --name "Sprint 1"
mcli groups create <boardId> --name "Done" --color done
```

### Users & teams

```bash
mcli users list
mcli users list --table
mcli users list --limit 200 --page 2        # paginate for large accounts
mcli users teams                             # list all teams
mcli users teams --table
```

### Docs

```bash
mcli docs list                               # list all docs
mcli docs list --workspace-id 12345          # filter by workspace
mcli docs create --workspace-id 12345 --name "My Doc"
mcli docs create --workspace-id 12345 --name "My Doc" --content "# Hello\nSome content"
mcli docs create --workspace-id 12345 --name "My Doc" --kind private
mcli docs content <docId> "## New Section\nContent here"   # add content to existing doc
```

### Folders

```bash
mcli folders create --workspace-id 12345 --name "Sprint Docs"
mcli folders create --workspace-id 12345 --name "Archive" --color bright-red
```

### Notifications

```bash
mcli notifications create --user <userId> --target <itemId> --text "Task ready" --type Project
mcli notifications create --user <userId> --target <updateId> --text "See this" --type Post
```

### Search

```bash
mcli search "tasks"                          # search boards by name
mcli search "tasks" --table
mcli search "tasks" --type docs              # search docs only
mcli search "tasks" --type all               # search boards and docs
```

### Raw GraphQL

```bash
mcli graphql '{ me { id name email } }'
mcli graphql 'query { boards(limit: 5) { id name } }'
mcli graphql 'query GetBoard($id: ID!) { boards(ids: [$id]) { id name } }' --variables '{"id": "12345"}'
```

## Output

All commands output JSON by default. Add `--table` for human-readable output:

```bash
mcli boards list --table
mcli items list <boardId> --table
```

---

## Use with coding agents

### Claude Code CLI (plugin — recommended)

> **Note:** These slash commands only work in the Claude Code CLI (`claude` in terminal) and VS Code/JetBrains extensions. They do not work in the Claude desktop app.

Requires Claude Code v2.1.128+. Type these as **slash commands** directly in the Claude Code chat — not as prompts to the AI:

```
/plugin marketplace add itsalexr/mcli
/plugin install monday@monday-cli
/reload-plugins
```

The plugin puts `mcli` in PATH automatically. The Claude Code plugin lives in `claude-plugin/` inside this repo.

---

## Development

```bash
npm run build          # compile TypeScript
npm test               # run all tests
npx jest --testPathPattern=boards   # run a specific module's tests
npm run dev            # run via ts-node (no build step)
```

## Publishing

```bash
npm run build
npm publish --access public
```

## Configuration

| Variable | Description |
|---|---|
| `MONDAY_TOKEN` | API token (required) |
| `API_VERSION` | monday.com API version (default: `2026-07`) |
