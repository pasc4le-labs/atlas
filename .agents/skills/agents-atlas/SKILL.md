---
name: agents-atlas
description: Use whenever a repository has an .agents/atlas/ directory (plans/, topics/, tmp/) — the agents-atlas convention for persisting plans, progress, and project summaries across sessions. Load this BEFORE starting any new work (must read topics/ and write a plan first), immediately AFTER finishing each task (must update PROGRESS.md), and immediately AFTER completing a plan (must update topics/). Also use when asked to set up, adopt, or bootstrap this convention in a new project.
---

# Agents-atlas (.agents/atlas/) convention

This project persists agent work in `.agents/atlas/`. The full rules live
in `.agents/atlas/README.md` — treat that file as canonical if it
conflicts with anything below. This skill exists to make sure the three
MUST-do actions actually happen, since they're easy to skip mid-task.

If `.agents/` doesn't exist yet in this project, bootstrap it with
`npx @pasc4le-labs/init-atlas` (copies the whole `.agents/` directory from
the `atlas` template package and symlinks `.claude` → `.agents`) rather than
inventing a new layout. That makes Claude Code discover the skill at
`.claude/skills/agents-atlas/`.

## 1. Plan first — read topics, then write the plan

Before starting any non-trivial work:

1. Read every file in `.agents/atlas/topics/*.md` first. This is the
   durable summary of what already exists (architecture, config, CLI,
   status, …). A new plan must build on this, not contradict it. If
   `topics/` is empty, this is a brand-new project — skip to writing the
   plan.
2. Pick the next zero-padded number and create
   `.agents/atlas/plans/NN/PLAN.md` (e.g. `atlas/plans/03/PLAN.md`) with
   the plan for the work.
3. Create `.agents/atlas/plans/NN/PROGRESS.md` alongside it (even if
   empty/"not started" to begin with) — every plan directory must have
   one.
4. If a task within the plan is too long to describe inline, write it as
   a spec at `.agents/atlas/plans/NN/specs/*.md` and link it from the
   plan instead of inflating PLAN.md.

Do not start implementation work in a repo using this convention without
a `.agents/atlas/plans/NN/PLAN.md` behind it.

## 2. Update PROGRESS.md after every task — no exceptions

The instant a task from the plan is finished (not batched, not deferred
to end-of-session), update `.agents/atlas/plans/NN/PROGRESS.md`:

- What was done.
- Any deviation from the plan and why.
- What's next.

Never leave `PROGRESS.md` stale relative to the actual state of the work.
If you finish a task and the next action isn't "update PROGRESS.md," stop
and do that first.

## 3. Update topics/ after every plan — no exceptions

When a plan is fully complete, update `.agents/atlas/topics/NN-name.md`
(creating a new topic file if the change doesn't fit an existing one —
pick the next number) to reflect what changed: new commands, new config
keys, new invariants, updated status/roadmap. Topics describe **what
exists now**; if you close out a plan without touching topics, the next
agent's "read topics first" step will hand out stale information.

## 4. Commit as you go

Everything under `.agents/` is tracked in git **except
`.agents/atlas/tmp/`**, which is git-ignored disposable scratch space.
Commit plans, progress, specs, and topics after every meaningful change
(a finished task, an updated topic) rather than batching it all for
later. If something in `tmp/` turns out to matter, move it into a plan or
topic first — don't expect it to survive.
