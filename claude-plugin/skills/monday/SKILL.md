---
description: Manage monday.com boards, items, columns, docs, and updates. Use when the user mentions monday.com, boards, tasks, sprints, work items, docs, or project management via monday.
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
mcli boards create --name "Name" [--kind public|private|share] [--workspace-id <id>]
mcli boards activity <boardId> [--from <ISO date>] [--to <ISO date>] [--limit 50]
```

**Columns**
```
mcli boards columns create <boardId> --type <type> --title "Title" [--description "..."]
mcli boards columns delete <boardId> <columnId>
```
Common column types: `text`, `status`, `date`, `numbers`, `person`, `timeline`, `checkbox`, `link`, `email`, `phone`, `dropdown`, `doc`.

**Items**
```
mcli items list <boardId>                                  # list items
mcli items list <boardId> --columns                        # include column values
mcli items create <boardId> --name "Item name" [--group-id <id>] [--column-values '{}']
mcli items update-columns <boardId> <itemId> '{}'          # update column values
mcli items delete <itemId>                                 # delete an item
mcli items move <itemId> --group <groupId>                 # move to a different group
mcli items subitem <parentItemId> --name "Sub-task" [--column-values '{}']
mcli items duplicate <boardId> <itemId> [--with-updates]   # duplicate (with comments)
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

**Docs**
```
mcli docs list [--workspace-id <id>] [--limit 50] [--page 1]
mcli docs create --workspace-id <id> --name "Doc name" [--kind public|private|share] [--content "<markdown>"] [--folder-id <id>]
mcli docs content <docId> "<markdown>"                     # append content to existing doc
```

**Folders**
```
mcli folders create --workspace-id <id> --name "Folder name" [--color <color>]
```

**Users & Teams**
```
mcli users list [--limit 200] [--page 1]                   # list users (paginates)
mcli users teams [--limit 200]                             # list teams with members
```

**Workspaces**
```
mcli workspaces                                            # list workspaces
mcli workspaces create --name "Name" --kind open|closed [--description "..."]
```

**Notifications**
```
mcli notifications create --user <userId> --target <targetId> --text "..." --type Post|Project
```
`Post` = notify about an update/reply (target is update ID). `Project` = notify about an item/board (target is item or board ID).

**Search**
```
mcli search "term"                                         # search boards by name
mcli search "term" --type docs                             # search docs only
mcli search "term" --type all                              # search boards and docs
```

**Other**
```
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
- Use `mcli items subitem` to create a child item under a parent item (subitems appear nested in monday.com).
- For docs: `docs create` creates the doc; `docs content` appends markdown to it. You can combine both in one step with `--content` on create.
- For complex queries not covered above, use `mcli graphql '<query>'`.
