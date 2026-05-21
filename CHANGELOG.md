# Changelog

All notable changes to `@itsalexr/mcli` are documented here.

---

## [1.2.2] — 2026-05-21

### Fixed
- `boards activity` failed with "invalid type for variable: 'from'" when no `--from`/`--to` flags were provided. Commander v12 stores arrow functions passed as option defaults as-is (as a parse callback) rather than calling them — defaults are now computed at runtime inside the action handler.

---

## [1.2.1] — 2026-05-21

### Fixed
- `users teams` failed with "Unknown argument 'limit' on field 'Query.teams'" — monday.com's `teams` root field does not accept a `limit` argument. Removed the unsupported variable from the query.

---

## [1.2.0] — 2026-05-21

### Added
- **Columns** — `boards columns create <boardId> --type <type> --title <title>`, `boards columns delete <boardId> <columnId>`
- **Docs** — `docs list`, `docs create --workspace-id <id> --name <name> [--content "<markdown>"]`, `docs content <docId> "<markdown>"`
- **Folders** — `folders create --workspace-id <id> --name <name> [--color <color>]`
- **Notifications** — `notifications create --user <id> --target <id> --text "..." --type Post|Project`
- **Subitems** — `items subitem <parentItemId> --name <name>` — creates a child item nested under a parent
- **Duplicate item** — `items duplicate <boardId> <itemId> [--with-updates]`
- **Teams** — `users teams` — lists all teams with member counts
- **Workspace create** — `workspaces create --name <name> --kind open|closed`
- **Search extended** — `search <term> --type boards|docs|all` (default remains `boards` for backward compatibility)
- Auto-publish CI via GitHub Actions OIDC (no OTP needed on push to main)

---

## [1.1.1] — 2026-05-20

### Fixed
- `boards create --kind share` was rejected by Zod validation — `share` is a valid monday.com board kind and is now accepted
- `users list` silently truncated at 200 rows with no way to page past them — added `--page <n>` option and fixed the GraphQL query to pass `$page`
- Version string in `src/index.ts` was out of sync with `package.json` (showed `1.0.0` instead of `1.1.0`)
- README did not document any of the 9 commands added in v1.1.0

---

## [1.1.0] — 2026-05-20

### Added
- `updates list <itemId> [--limit 25] [--page 1]` — read item comments
- `boards schema <boardId>` — columns and groups only (lighter than `boards get`)
- `boards create --name <name> [--kind public|private|share] [--workspace-id <id>]`
- `boards activity <boardId> [--from <date>] [--to <date>] [--limit 50]` — activity log
- `items delete <itemId>`
- `items move <itemId> --group <groupId>`
- `groups create <boardId> --name <name> [--color <color>]`
- `users list [--limit 200]`
- `search <term>` — board-name search (client-side substring match)
- Claude Code plugin (`/plugin marketplace add itsalexr/mcli`)

---

## [1.0.0] — 2026-05-20

### Added
Initial release. Commander-based CLI wrapping monday.com's GraphQL API.

- **Auth** — `auth login`, `auth status`, `auth logout` — token stored in `~/.env`
- **Me** — `me` — current user info
- **Workspaces** — `workspaces [--limit 50] [--page 1]`
- **Boards** — `boards list [--workspace-id <id>]`, `boards get <boardId>`
- **Items** — `items list <boardId> [--columns] [--cursor]`, `items create <boardId>`, `items update-columns <boardId> <itemId> '{}'`
- **Updates** — `updates create <itemId> "text"`
- **GraphQL** — `graphql '<query>' [--variables '{}']` — raw passthrough
- JSON output by default; `--table` flag for human-readable tables
- Published as `@itsalexr/mcli` on npm — `npx @itsalexr/mcli` works without install
