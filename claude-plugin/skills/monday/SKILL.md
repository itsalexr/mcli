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
mcli boards list                         # list all boards
mcli boards list --table                 # table format
mcli boards get --id <board_id>          # board details
```

**Items**
```
mcli items list --board <board_id>                         # list items
mcli items list --board <board_id> --table                 # table format
mcli items create --board <board_id> --name "Item name"    # create item
mcli items update-columns --item <item_id> --columns '{}'  # update columns
```

**Updates (comments)**
```
mcli updates create --item <item_id> --body "Update text"  # post an update
```

**Other**
```
mcli workspaces          # list workspaces
mcli me                  # current user info
mcli graphql             # raw GraphQL (pipe JSON to stdin)
```

## Flags

- `--table` — render output as a table instead of JSON
- `--json` — force JSON output

## Tips

- Board IDs and item IDs are integers. Ask the user for them or list first to find the right one.
- When the user asks to "update" an item, clarify whether they mean updating column values (`items update-columns`) or posting a comment (`updates create`).
- For complex queries not covered by the commands above, use `mcli graphql`.
