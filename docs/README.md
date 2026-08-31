# Atlas: the agents-atlas convention

Atlas is a convention plus a scaffolder. The convention gives coding agents
a fixed place inside a repository to persist their work across sessions; the
scaffolder (`npx init-atlas`) installs it into any project in one command.

## What gets installed

Running `npx init-atlas` in a project is interactive: pick where the
atlas convention should live, then choose whether to install the skill
with the skills CLI. The atlas component looks like this:

```
<dest>/                 # e.g. .agents/atlas, .atlas, .claude/agents, ...
├── README.md           # the convention itself (agents only)
├── plans/
    │   ├── NN/             # one directory per ACTIVE plan, zero-padded number
    │   │   ├── PLAN.md     # the plan itself
    │   │   ├── PROGRESS.md # MUST be updated at the end of every task
    │   │   ├── specs/*.md  # specs for long tasks
    │   │   └── *.md        # other supporting material
    │   └── XX.md           # tombstone: finished plan (see "Finished plans")
├── topics/
│   └── NN-name.md      # durable project summaries, one per topic
└── tmp/                # scratch space (git-ignored)
```

Suggested destinations (arrow-key selector, `Custom path` supported):

| Destination | Use case |
| --- | --- |
| `.agents/atlas` | inside the agents convention (default) |
| `.atlas` | top-level project dir |
| `.claude/agents` | Claude Code dir |
| `.codex/atlas` | Codex CLI dir |
| `.docs/` | docs location |
| `.ai/` | AI working dir |
| `.config/atlas` | config location |

The skill is installed separately with the skills CLI (Vercel Labs), which
auto-detects your agents and routes it to the right place:

```bash
npx skills add https://github.com/pasc4le-labs/atlas/tree/main/.agents/skills/atlas
```

The convention dir is for agents only, not user-facing documentation.
User-facing docs stay in the root `README.md` and `docs/`.

## Convention rules

### Plans

- Plans live at `.agents/atlas/plans/NN/PLAN.md` (e.g. `plans/01/PLAN.md`).
- Each plan gets its own numbered directory `plans/NN/`.
- Before writing a plan, read every file in `topics/` first. A plan must
  build on the existing project state, not contradict it.

### Progress

- Every plan directory must contain `plans/NN/PROGRESS.md`.
- `PROGRESS.md` must be updated at the end of every task. Never leave it
  stale after finishing a task.

### Finished plans

- When a plan is **fully complete AND shipped**, collapse the whole
  `.agents/atlas/plans/NN/` directory into a single `.agents/atlas/plans/XX.md`
  (XX = the plan number, e.g. `plans/01.md`) holding a VERY SHORT description of
  what the plan did — a few sentences or bullets, never the full PLAN.md. Then
  remove the finished plan's directory `plans/NN/` (PLAN.md, PROGRESS.md,
  specs) and commit.
- Long-lived detail still belongs in `topics/`. The XX.md is a tidy tombstone so
  a finished plan doesn't leave a sprawling folder behind.

### Topics

- `topics/NN-name.md` files hold durable project summaries split by topic
  (architecture, business logic, config schema, pipeline, CLI, testing/CI,
  status/roadmap, ...). The zero-padded `NN-` prefix orders them.
- Topics describe what exists; plans describe what to build. Topics are the
  reference an agent reads first.
- At the end of each plan, topics must be updated to reflect what changed.

### Long tasks

- Tasks too long for the plan become a spec in their own file inside the
  plan directory (e.g. `plans/01/specs/02-frontend-pipeline.md`). The plan
  links to the spec.

### Working files

- Temporary notes and in-progress material go under `.agents/atlas/tmp/`
  or inside the relevant plan directory.
- `tmp/` is git-ignored (only `.gitkeep` is tracked). Nothing placed there
  is committed; treat it as disposable scratch space.

### Committing

- Everything except `tmp/` is committed: plans, progress, specs, and
  topics. Commit after every meaningful change.

## CLI reference

`npx init-atlas` walks you through the install interactively: destination
selector, overwrite confirmations, and the skill install prompt.

| Command | Effect |
| --- | --- |
| `npx init-atlas` | Interactive install into the current directory |
| `npx init-atlas ../proj` | Install into another directory |
| `npx init-atlas --dest .atlas` | Skip the selector, install to a specific path |
| `npx init-atlas --no-skill` | Skip the skill prompt entirely |
| `npx init-atlas --with-skill` | Run the skill install without asking |
| `npx init-atlas --force` | Overwrite existing files without asking |
| `npx init-atlas --yes` | Assume yes for all confirmation prompts |
| `npx init-atlas --quiet` | Suppress success output |
| `npx init-atlas --help` | Show help |
| `npx init-atlas --version` | Show version |

## Behavior

- The install is interactive when run in a terminal: an arrow-key
  selector asks where the atlas convention should live (`.agents/atlas`,
  `.atlas`, `.claude/agents`, `.codex/atlas`, `.docs/`, `.ai/`,
  `.config/atlas`, or a custom path), then asks whether to install the
  skill now with the skills CLI, print the command, or skip.
- In non-interactive contexts (piped, CI), the default destination is
  `.agents/atlas`, the skill command is printed, and nothing is prompted.
- If the destination already exists, the CLI warns and asks for
  confirmation before overwriting. Existing unrelated files are never
  removed; only the atlas dir itself is replaced on confirmation.
- The skill itself is installed via `npx skills` (Vercel Labs CLI). It
  auto-detects your agents (Claude Code, Codex, Cursor, ...) and routes
  the skill to the right directory. Choose "Print command" to run it
  yourself later.

## Publishing

Both names are published from this repo. The canonical package is
`init-atlas`; `@pasc4le-labs/atlas` is an alias with identical content.

To release a new version:

1. Bump `version` in `package.json`.
2. `npm publish` (publishes `init-atlas`).
3. `./scripts/publish-scoped-alias.sh` (publishes `@pasc4le-labs/atlas`).

## Badge

[![agents: atlas](https://img.shields.io/badge/agents-atlas-blueviolet?style=flat-square)](https://github.com/pasc4le-labs/atlas)

```markdown
[![agents: atlas](https://img.shields.io/badge/agents-atlas-blueviolet?style=flat-square)](https://github.com/pasc4le-labs/atlas)
```

## License

MIT
