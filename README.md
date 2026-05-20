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
> - `npx @itsalexr/mcli items list <boardId> [--columns] [--table]`
> - `npx @itsalexr/mcli items create <boardId> --name "Task"`
> - `npx @itsalexr/mcli updates create <itemId> "comment text"`
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
```

### Boards

```bash
mcli boards list
mcli boards list --workspace-id 12345
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

### Updates (comments)

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
