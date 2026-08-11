# Atlas: the agents-atlas convention

Atlas is a convention plus a scaffolder. The convention gives coding agents
a fixed place inside a repository to persist their work across sessions; the
scaffolder (`npx init-atlas`) installs it into any project in one command.

## What gets installed

Running `npx init-atlas` in a project creates:

```
.agents/
├── skills/
│   └── agents-atlas/
│       └── SKILL.md       # Claude Code skill that enforces this convention
└── atlas/
    ├── README.md          # the convention itself (agents only)
    ├── plans/
    │   └── NN/            # one directory per plan, zero-padded number
    │       ├── PLAN.md    # the plan itself
    │       ├── PROGRESS.md    # MUST be updated at the end of every task
    │       ├── specs/*.md     # specs for long tasks
    │       └── *.md           # other supporting material
    ├── topics/
    │   └── NN-name.md     # durable project summaries, one per topic
    └── tmp/               # scratch space (git-ignored)
```

Plus a `.claude` symlink pointing at `.agents`, so Claude Code discovers the
skill at `.claude/skills/agents-atlas/`.

`.agents/` is for agents only, not user-facing documentation. User-facing
docs stay in the root `README.md` and `docs/`.

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

`npx init-atlas` copies the `.agents/` scaffold into the target directory
and creates the `.claude` symlink.

| Command | Effect |
| --- | --- |
| `npx init-atlas` | Install into the current directory |
| `npx init-atlas ../proj` | Install into another directory |
| `npx init-atlas ../proj --force` | Replace an existing `.agents/` |
| `npx init-atlas --no-link` | Skip the `.claude` symlink |
| `npx init-atlas --copy-claude` | Copy `.claude` instead of symlinking |
| `npx init-atlas --help` | Show help |
| `npx init-atlas --version` | Show version |

Notes:

- `--copy-claude` is the safe fallback on Windows, where symlinks need
  elevated privileges.
- The CLI has zero dependencies; the package is ~6 kB.
- Help text derives the command from the package name, so the scoped alias
  `@pasc4le-labs/atlas` shows the correct invocation.

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
