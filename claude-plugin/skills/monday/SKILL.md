---
description: Manage monday.com boards, items, columns, and updates. Use when the user mentions monday.com, boards, tasks, sprints, work items, or project management via monday.
---

Use the `mcli` CLI to interact with monday.com. It is in your PATH.

Before the first command, check auth:
```
mcli auth status
```
If not authenticated, run `mcli auth login` and follow the prompts (or set MONDAY_TOKEN env var).

## Commands

**Boards**
```
mcli boards list                                           # list all boards
mcli boards list --workspace-id <id>                      # filter by workspace
mcli boards get <boardId>                                  # full board details
mcli boards schema <boardId>                               # columns and groups only
mcli boards create --name "Name" [--kind public|private] [--workspace-id <id>]
mcli boards activity <boardId> [--from <ISO date>] [--to <ISO date>] [--limit 50]
```

**Items**
```
mcli items list <boardId>                                  # list items
mcli items list <boardId> --columns                        # include column values
mcli items create <boardId> --name "Item name" [--group-id <id>] [--column-values '{}']
mcli items update-columns <boardId> <itemId> '{}'          # update column values
mcli items delete <itemId>                                 # delete an item
mcli items move <itemId> --group <groupId>                 # move to a different group
```

**Updates (comments)**
```
mcli updates create <itemId> "Update text"                 # post a comment
mcli updates list <itemId> [--limit 25] [--page 1]        # read comments
```

**Groups**
```
mcli groups create <boardId> --name "Group name" [--color done|stuck|working_on_it]
```

**Users**
```
mcli users list                                            # list all account users
```

**Search**
```
mcli search "term"                                         # search boards by name
```

**Other**
```
mcli workspaces          # list workspaces
mcli me                  # current user info
mcli graphql '<query>'   # raw GraphQL
```

## Flags

- `--table` — render output as a table instead of JSON (works with most commands)

## Tips

- Board IDs, item IDs, and group IDs are strings/integers. Use `mcli boards list` or `mcli boards schema <id>` to discover them before writing.
- Run `mcli boards schema <boardId>` before updating column values — it tells you column IDs and group IDs.
- When the user asks to "update" an item, clarify: column values (`items update-columns`) vs. posting a comment (`updates create`).
- Use `mcli updates list <itemId>` to read existing comments before adding new ones.
- For complex queries not covered above, use `mcli graphql '<query>'`.
