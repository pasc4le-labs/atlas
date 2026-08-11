# atlas

Scaffold the **agents-atlas convention** into any project. It gives agents
a fixed place to persist plans, progress, and project summaries across
sessions. The installer asks where the convention should live and offers
to install the Claude Code skill via the skills CLI.

## Install

```bash
npx init-atlas              # interactive: pick a location, install skill
npx init-atlas ../proj      # install into another project
```

Also published as `@pasc4le-labs/atlas`.

Safe to run on a project that already has a `.agents/` directory: the
installer merges in and existing files are never removed unless you confirm
an overwrite.

## Options

| Option | Description |
| --- | --- |
| `--dest <path>` | Install to a specific path (skips the selector) |
| `--no-skill` | Skip the skill install prompt |
| `--with-skill` | Run the skill install without asking |
| `--force` | Overwrite existing files without asking |
| `--yes` | Assume yes for all confirmation prompts |
| `--quiet` | Suppress success output |

## Docs

Detailed documentation lives in [docs/](docs/README.md).

## License

MIT
