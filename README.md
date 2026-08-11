# atlas

Scaffold the **agents-atlas convention** into any project. It gives agents
a fixed place to persist plans, progress, and project summaries across
sessions (`.agents/`), with a Claude Code skill you can opt into via
`--claude`.

## Install

```bash
npx init-atlas              # install into current directory
npx init-atlas ../proj      # install into another project
```

Also published as `@pasc4le-labs/atlas`.

Safe to run on a project that already has a `.agents/` directory: the
scaffold merges in and existing files are never removed unless you confirm
an overwrite.

## Options

| Option | Description |
| --- | --- |
| `--force` | Overwrite existing `atlas/` or skill without asking |
| `--yes` | Assume yes for all confirmation prompts |
| `--quiet` | Suppress success output |
| `--claude` | Link `.claude` → `.agents` (Claude Code skill discovery) |
| `--copy-claude` | Copy `.claude` instead of linking (with `--claude`, last resort) |

## Docs

Detailed documentation lives in [docs/](docs/README.md).

## License

MIT
