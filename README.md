# atlas

Template repo for the **agent docs convention** — a fixed place for
agents to persist plans, progress, and project summaries across
sessions. This repo holds no project content; it's the scaffold you
copy elsewhere.

Includes a Claude Code skill (`.agents/skills/agents-atlas/`) that
enforces the convention's MUST-do rules: plan before working, update
`PROGRESS.md` after every task, and update `topics/` after every plan.

## Usage

```bash
npx @pasc4le-labs/atlas            # install into current directory
npx @pasc4le-labs/atlas ../proj    # install into another directory
```

The same package is also published unscoped, as a shorter alias:

```bash
npx init-atlas                     # identical behavior
```

This copies the `.agents/` scaffold into the target project and symlinks
`.claude` → `.agents` so Claude Code discovers the skill at
`.claude/skills/agents-atlas/`.

Options: `--force` (overwrite an existing `.agents/`), `--no-link` (skip the
`.claude` symlink), `--copy-claude` (copy instead of symlink — Windows
fallback). The old manual method still works if you prefer it:

```bash
cp -r .agents /path/to/new-project/.agents
ln -s .agents /path/to/new-project/.claude
```

See [`.agents/atlas/README.md`](.agents/atlas/README.md) for the convention itself, and
[`.agents/skills/agents-atlas/SKILL.md`](.agents/skills/agents-atlas/SKILL.md)
for the skill that enforces it.

## Badge

If your project uses this convention, add the badge to your README:

[![agents: atlas](https://img.shields.io/badge/agents-atlas-blueviolet?style=flat-square)](https://github.com/pasc4le-labs/atlas)

```markdown
[![agents: atlas](https://img.shields.io/badge/agents-atlas-blueviolet?style=flat-square)](https://github.com/pasc4le-labs/atlas)
```
