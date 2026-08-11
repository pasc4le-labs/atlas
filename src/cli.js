'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const pkg = require('../package.json');
const VERSION = pkg.version;
const PKG_NAME = pkg.name;
const SCAFFOLD_DIR = path.join(__dirname, '..', '.agents');

const HELP = `atlas: bootstrap the agents-atlas convention into a project

Usage:
  npx ${PKG_NAME} [dir] [options]

  dir        target project directory (default: current directory)

Options:
  -f, --force       overwrite existing files without asking
  -y, --yes         assume yes for all confirmation prompts
  -q, --quiet       suppress success output (warnings/errors still shown)
      --claude      link .claude -> .agents (Claude Code skill discovery)
      --copy-claude copy .claude instead of linking (last resort)
  -v, --version     print version
  -h, --help        show this help

Examples:
  npx ${PKG_NAME}                        # install into current directory
  npx ${PKG_NAME} ../my-project --force  # overwrite existing atlas/skill
`;

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = (s) => paint('32', s);
const yellow = (s) => paint('33', s);
const red = (s) => paint('31', s);
const dim = (s) => paint('2', s);
const bold = (s) => paint('1', s);

function fail(message) {
  console.error(`${red('error')}: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = {
    dir: null,
    force: false,
    yes: false,
    quiet: false,
    link: false,
    copyClaude: false,
  };
  for (const arg of argv) {
    switch (arg) {
      case '-h':
      case '--help':
        console.log(HELP);
        process.exit(0);
        break;
      case '-v':
      case '--version':
        console.log(VERSION);
        process.exit(0);
        break;
      case '-f':
      case '--force':
        opts.force = true;
        break;
      case '-y':
      case '--yes':
        opts.yes = true;
        break;
      case '-q':
      case '--quiet':
        opts.quiet = true;
        break;
      case '--claude':
        opts.link = true;
        break;
      case '--copy-claude':
        opts.copyClaude = true;
        opts.link = true;
        break;
      default:
        if (arg.startsWith('-')) fail(`unknown option: ${arg}`);
        if (opts.dir) fail(`unexpected argument: ${arg}`);
        opts.dir = arg;
    }
  }
  return opts;
}

function askConfirm(question) {
  if (!process.stdin.isTTY) return Promise.resolve(false);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${yellow('?')} ${question} [y/N] `, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function copyComponent(rel, src, dest, opts, say) {
  const present = fs.existsSync(dest);
  if (present && !opts.force && !opts.yes) {
    const ok = await askConfirm(`${rel} already exists in .agents. Overwrite it?`);
    if (!ok) {
      console.warn(`${yellow('!')} ${dim(rel)} already present; left untouched`);
      return 'skipped';
    }
  }
  if (present) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.cpSync(src, dest, { recursive: true, force: true });
  say(`${green('✓')} ${dim(rel)} ${present ? 'updated' : 'created'}`);
  return present ? 'updated' : 'created';
}

function linkClaude(targetDir, opts, say) {
  const claudePath = path.join(targetDir, '.claude');
  const exists = fs.existsSync(claudePath) || Boolean(fs.lstatSync(claudePath, { throwIfNoEntry: false }));

  if (exists) {
    if (!opts.force && !opts.yes) {
      console.warn(`${yellow('!')} ${dim('.claude')} already exists; left untouched (use --force to replace)`);
      return;
    }
    fs.rmSync(claudePath, { recursive: true, force: true });
  }

  if (opts.copyClaude) {
    fs.cpSync(SCAFFOLD_DIR, claudePath, { recursive: true, force: true });
    say(`${green('✓')} ${dim('.claude')} copied`);
    return;
  }

  if (process.platform === 'win32') {
    // Junction: the Windows-native directory link. Works without admin or
    // Developer Mode and is transparent to applications, so Claude Code
    // follows it exactly like a symlink.
    fs.symlinkSync(path.resolve(targetDir, '.agents'), claudePath, 'junction');
    say(`${green('✓')} ${dim('.claude')} ${green('->')} ${dim('.agents')} junction`);
    return;
  }

  fs.symlinkSync('.agents', claudePath, 'dir');
  say(`${green('✓')} ${dim('.claude')} ${green('->')} ${dim('.agents')} linked`);
}

async function main(argv) {
  const opts = parseArgs(argv);
  const targetDir = path.resolve(opts.dir || '.');
  const say = (msg) => { if (!opts.quiet) console.log(msg); };

  if (!fs.existsSync(SCAFFOLD_DIR)) {
    fail('internal error: scaffold payload (.agents) missing from package');
  }
  if (!fs.existsSync(targetDir)) {
    fail(`target directory does not exist: ${targetDir}`);
  }
  if (!fs.statSync(targetDir).isDirectory()) {
    fail(`target is not a directory: ${targetDir}`);
  }

  const agentsDir = path.join(targetDir, '.agents');
  fs.mkdirSync(agentsDir, { recursive: true });

  const components = [
    {
      rel: '.agents/atlas',
      src: path.join(SCAFFOLD_DIR, 'atlas'),
      dest: path.join(agentsDir, 'atlas'),
    },
    {
      rel: '.agents/skills/agents-atlas',
      src: path.join(SCAFFOLD_DIR, 'skills', 'agents-atlas'),
      dest: path.join(agentsDir, 'skills', 'agents-atlas'),
    },
  ];

  const results = [];
  for (const c of components) {
    results.push(await copyComponent(c.rel, c.src, c.dest, opts, say));
  }

  if (opts.link) {
    linkClaude(targetDir, opts, say);
  }

  if (!opts.quiet) {
    console.log();
    console.log(`${green('Done')}. agents-atlas convention installed in ${bold(targetDir)}`);
    console.log(`Next: read ${dim('.agents/atlas/README.md')}, then create ${dim('.agents/atlas/plans/01/PLAN.md')} before starting work.`);
    if (!opts.link) {
      console.log(dim('Tip: add --claude to link .claude -> .agents for Claude Code.'));
    }
  }
}

module.exports = { main, parseArgs };

if (require.main === module) {
  main(process.argv.slice(2)).catch((err) => fail(err.message));
}
