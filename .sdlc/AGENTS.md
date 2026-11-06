<!-- sdlc:managed:start v1 sha256:71591dffdc13 -->
# Work records

This folder holds SDLC tickets, task records, `roadmap.md`, `notes.md`, and `config`. `tickets.py roadmap` (also run by `new` and `close`) generates this block: do not edit inside it; change a ticket's `handoff.md` front matter and rerun `roadmap`. `roadmap.md` lists every ticket in dependency order. Closed `.NNNN-*` folders are history: open one only when asked.

- Ticket folders: `tickets/`; the same procedures are in `tickets/AGENTS.md`.
- Mailbox: `messages/` is a git-ignored mailbox, not a record; follow `messages/AGENTS.md` to send, read, reply, ack, or expire a message with `<plugin-root>/scripts/messages.py`.
- `<plugin-root>` is the installed sdlc plugin folder, the one holding `scripts/tickets.py`: `${CLAUDE_PLUGIN_ROOT}` in Claude Code; in Codex, the folder two levels above the `sdlc` skill.
- No plugin installed: follow `.sdlc/by-hand.md` to create, claim, release or close a ticket with git alone.

## Stages

- proposed: 1
  - T-0064 Parity W7 · Decide scope of specialist components (parity-wave-7-scope)
- ready: 27
  - T-0037 Parity W1 · Button link (button-link)
  - T-0038 Parity W1 · Setting row (setting-row)
  - T-0039 Parity W1 · Data list (data-list)
  - T-0040 Parity W1 · Stat card (stat-card)
  - T-0041 Parity W2 · File picker (file-picker)
  - T-0042 Parity W2 · Chip select (chip-select)
  - T-0043 Parity W2 · Selection control (selection-control)
  - T-0044 Parity W2 · Color picker (color-picker)
  - T-0045 Parity W3 · Grid keyboard navigation foundation (grid-navigation)
  - T-0046 Parity W3 · Calendar (calendar)
  - T-0047 Parity W3 · Date picker (date-picker)
  - T-0048 Parity W3 · Date range picker (date-range-picker)
  - T-0049 Parity W3 · Time picker (time-picker)
  - T-0050 Parity W4 · Toolbar (toolbar)
  - T-0051 Parity W4 · Command bar (command-bar)
  - T-0052 Parity W4 · Search trigger (search-trigger)
  - T-0053 Parity W4 · Tree view (tree-view)
  - T-0054 Parity W4 · Sidebar (sidebar)
  - T-0055 Parity W5 · Pane and scroll-region geometry foundation (scroll-region-geometry)
  - T-0056 Parity W5 · Page (page)
  - T-0057 Parity W5 · Pane (pane)
  - T-0058 Parity W5 · Content shell (content-shell)
  - T-0059 Parity W5 · App and editor shell (app-shell)
  - T-0060 Parity W5 · Admin shell (admin-shell)
  - T-0061 Parity W5 · Floating panel (floating-panel)
  - T-0062 Parity W6 · Data table (data-table)
  - T-0063 Parity W6 · Chart (chart)
- claimed: 1
  - T-0036 Parity W1 · Breadcrumb (breadcrumb), claimed by claude 2026-11-06
- paused: 0
- blocked: 0
- done: 37
- dropped: 0

## Procedures

Folder layout:
- The top of `.sdlc` holds only ticket and task folders (a folder with a `handoff.md` or `plan-doc.md`), `AGENTS.md`, `CLAUDE.md`, `by-hand.md`, `config`, `roadmap.md`, `board.md`, `notes.md`, `notes/`, `fleet.json`, `gate-ledger.jsonl`, `messages/`, `runtime/`, `supervisor/`, `evals/`, `proposals/`, `goals/`, `tickets/`, `work/`, `archive/`, and `_`- or `.`-prefixed entries. A `top_level_allow: <glob>, ...` line in `.sdlc/config` allows more.
- Run records (role results, attempts, `runs.jsonl`, `skips.md`) go in the git-ignored records dir `.sdlc/runtime/tasks/<folder>/` (`<plugin-root>/scripts/order.py records-dir .sdlc/tickets/<folder>` prints it). Notes go to `notes.md`, an answer to another agent goes by `messages.py send`, anything else into `archive/`.
- `python3 <plugin-root>/scripts/tickets.py --root .sdlc check` warns on any other top-level entry; `python3 <plugin-root>/scripts/tickets.py --root .sdlc tidy` lists its move into `archive/` and `python3 <plugin-root>/scripts/tickets.py --root .sdlc tidy --apply` makes it. Move nothing under `.sdlc` while a `*.running` marker exists: a role is using it.

Create a ticket:
1. Run `python3 <plugin-root>/scripts/tickets.py --root .sdlc new <feature|bug|chore|spike|idea> <slug> "<title>"`. Never pick an id by hand: `new` stamps the next id above every worktree's.
2. Fill in the body sections of the new `handoff.md`.

Ticket fields:
status: proposed | ready | claimed | paused | blocked | done | dropped
- `area:` is optional: the ticket's domain, one of the `areas:` names in `.sdlc/config`. It is never a lane or branch name.
- `paused_reason:` is the one-line reason a `status: paused` ticket waits; `status: claimed` needs `claimed_by:`.
- `branch:` and `worktree:` name the ticket's lane branch and its worktree (relative to the main checkout, under the worktree root `../<repo>.worktrees/`, `wtroot.py root`); the lane opener writes both and its close removes both. `check` warns on a `worktree:` that is not a registered worktree on that branch.

Claim a ticket:
1. Open its `handoff.md`. A `claimed_by:` front matter line means another agent holds it: pick another ticket or ask the user.
2. Run `python3 <plugin-root>/scripts/tickets.py --root .sdlc claim <id>`; `--by <agent>` names the claimant and wins, else it takes `$SDLC_HOST`, else the host (`claude:<session8>`, `codex:<thread>`). In git it first reserves `refs/sdlc/claims/<id>`, so a claim from any worktree refuses naming the holder. It sets `status: claimed`, writes `claimed_by: <agent> <YYYY-MM-DD>` directly after `created:`, and runs `roadmap`. To take over a stale claim, add `--handover --reason "<why>"`.
3. Start the work through `run.sh`, which puts it in progress: `<plugin-root>/scripts/run.sh planner <level> .sdlc/tickets/<folder>/handoff.md`, or `/sdlc:chain .sdlc/tickets/<folder>`. Progress shows on `/board`.
4. Release: `python3 <plugin-root>/scripts/tickets.py --root .sdlc release <id>`. Pause: set `status: paused` and add a one-line `paused_reason:`, then rerun `roadmap`.

Open a lane:
1. Claim the ticket first: `<plugin-root>/scripts/lanes.py open` refuses an unclaimed local ticket.
2. Run `python3 <plugin-root>/scripts/lanes.py open <name> --kind solo --ticket <id>`. It makes the worktree and branch under the worktree root (`../<repo>.worktrees/`) and writes `branch: <lane branch>` and `worktree: <path>` after `claimed_by:`, so verified, unmerged work stays visible on the roadmap and in `lanes.py list --all`. A worktree made by hand: run `python3 <plugin-root>/scripts/tickets.py --root .sdlc branch <id> <branch> --worktree <path>`.
3. `lanes.py close <name>` removes the `branch:` and `worktree:` lines once the lane closes.

Close a ticket:
1. Run `python3 <plugin-root>/scripts/tickets.py --root .sdlc close <folder> --dry-run`. It checks the verifier verdict, lists each verifier `## Notes` line as `<i>. <tag>: <title>`, and ends with `expect <digest>`.
2. Run `python3 <plugin-root>/scripts/tickets.py --root .sdlc close <folder> --changed "<one line>"`. It appends `## Outcome` to the handoff; add `--lessons "<lesson>"` (repeatable) for a reusable lesson, one `- Lessons:` line each: route it to a named repo skill or NOTES.md. To file the one `decide:` follow-up worth a ticket, add `--ticket <i> --expect <digest>`. `note:` items and the other `decide:` items go to `notes.md`, where adding ` -> T-NNNN` to an item's line marks it routed (the roadmap lists the rest under Open follow-ups); `fix-now:` items are finished before the close. When it refuses because files cite the folder, add `--rewrite-refs` to rewrite them to the closed `.<folder>` path.
3. Only when a filer draft was asked for (`/file`): `python3 <plugin-root>/scripts/tickets.py --root .sdlc close <folder> --filer`.
4. Work already done by another ticket: `python3 <plugin-root>/scripts/tickets.py --root .sdlc close <folder> --reason "<why>"`. It skips the verdict gate but files follow-ups as step 2 does: the verifier `## Notes` lines and the handoff `## Follow-ups` bullets go to `notes.md`, and `--dry-run` and `--ticket <i> --expect <digest>` work the same.

Ticket lifecycle:
1. Pick and claim: `python3 <plugin-root>/scripts/tickets.py --root .sdlc claim <id> --by <agent>`.
2. Lane: `python3 <plugin-root>/scripts/steps.py lane .sdlc/tickets/<folder>` prints the lane.
3. Build: the solo agent, `/sdlc:fix`, or `/sdlc:chain .sdlc/tickets/<folder>`.
4. Verify: one independent verifier per ticket (`/sdlc:verify`).
5. Land: `python3 <plugin-root>/scripts/fanout.py land <branch>` for a lane branch, else merge the branch.
6. Close: `python3 <plugin-root>/scripts/tickets.py --root .sdlc close <folder> --changed "<one line>"`, as in Close a ticket above.
<!-- sdlc:managed:end -->
