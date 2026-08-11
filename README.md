# atlas

Scaffold the **agents-atlas convention** into any project. It gives agents
a fixed place to persist plans, progress, and project summaries across
sessions (`.agents/`), plus a Claude Code skill that enforces it.

## Install

```bash
npx init-atlas              # install into current directory
npx init-atlas ../proj      # install into another project
```

Also published as `@pasc4le-labs/atlas`.

## Options

| Option | Description |
| --- | --- |
| `--force` | Overwrite an existing `.agents/` |
| `--no-link` | Skip the `.claude` symlink |
| `--copy-claude` | Copy `.claude` instead of symlinking (Windows) |

## Docs

Detailed documentation lives in [docs/](docs/README.md).

## License

MIT
