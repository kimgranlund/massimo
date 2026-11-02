# Layout

Any other folder directly under `docs/` is a topic. It holds the designs, specifications, and decisions for one concept.

## Homes

- `work/`
- `specs/`
- `planning/`
- `decisions/`
- `designs/`
- `goals/`
- `kpi/`
- `references/`
- `guides/`
- `reports/`
- `assets/`
- `archive/`
- `other/`

## Kinds

| id | kind | holds | not | why | writer | form | life | entry | read | owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `work/` | work | ticket and task folders, the generated `ROADMAP.md` and `NOTES.md` | designs and plans under review -> `planning/` | work records next to the docs they change | `tickets.py` | `NNNN-slug/handoff.md`, `ROADMAP.md`, `NOTES.md` | close dot-renames in place | - | running or closing a ticket | `tickets.py` |
| `specs/` | specs | what the system is and must do | plans -> `planning/` | one place to trust | people | kebab-case | supersede to `archive/` | - | defining the system | `docs_check.py` |
| `planning/` | planning | proposals and plans under review | built facts -> `specs/` | decisions need a place | people | `status:` front matter | accept, then `archive/` | - | deciding or scheduling | `docs_check.py` |
| `decisions/` | decisions | one numbered decision per file | narrative -> `specs/` | reasons outlive people | people | `NNNN-slug.md`, `status:` | supersede | - | asking why | `docs_check.py` |
| `designs/` | designs | ratified grill designs, one file per round | edits in place -> a new file with `supersedes:` | a design stays as ratified | grill | kebab-case, `supersedes:` | write-once; a re-grill adds a new file | - | asking what a design settled | `docs_check.py` |
| `goals/` | goals | one intended outcome per file | change plans -> `planning/` | steering needs a record | people | `NNN-slug.md`, `status:` | achieve or drop, then `archive/` | - | steering the work | `docs_check.py` |
| `kpi/` | kpi | one measure per file | values over time -> `reports/` | a number needs a command | people | `NNN-slug.md`, `measure:` | edit in place | - | measuring an outcome | `docs_check.py` |
| `references/` | references | lookup tables and listings | steps -> `guides/` | fast lookup | people | kebab-case | edit in place | - | looking something up | `docs_check.py` |
| `guides/` | guides | procedures a person follows | tables -> `references/` | do, not explain | people | kebab-case | edit in place | - | doing a task | `docs_check.py` |
| `reports/` | reports | dated evidence | steps -> `guides/` | evidence stays fixed | people | `YYYY-MM-DD-slug.md` | immutable | - | checking what was verified | `docs_check.py` |
| `assets/` | assets | non-Markdown files cited by a document | Markdown -> its home | keep prose clean | people | kebab-case | with its citer | - | opening a cited file | `docs_check.py` |
| `archive/` | archive | superseded or retired documents | live documents -> their home | history without noise | people | `status:`, `superseded-by:` | keep | - | researching history | `docs_check.py` |
| `other/` | other | unsorted documents | anything with a home -> that home | a visible backlog | anyone | `owner:`, `review-by:` | review-by date | - | sorting the inbox | `docs_check.py` |

## Decide

1. Is it a ticket or task record, or the generated roadmap or notes file? yes -> `work/`
2. Is it a picture, diagram source or data file? yes -> `assets/`
3. Is it evidence of something that happened on a date? yes -> `reports/`
4. Is it one choice with its reasons and alternatives? yes -> `decisions/`
5. Is it a proposal, roadmap or plan under review? yes -> `planning/`
6. Is it an outcome to steer toward, with an owner and a status? yes -> `goals/`
7. Is it a measure with a command that runs it, a unit and a target? yes -> `kpi/`
8. Is it steps a person follows? yes -> `guides/`
9. Is it a table, listing or glossary you look things up in? yes -> `references/`
10. Is it a ratified design from a grill round, kept write-once? yes -> `designs/`
11. Does it describe what the system is or must do? yes -> `specs/`
12. Is it retired or superseded? yes -> `archive/`
otherwise -> `other/`

## Frozen paths

- `docs/reports/`

## Legacy
