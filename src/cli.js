'use strict';

const fs = require('fs');
const path = require('path');

const VERSION = require('../package.json').version;
const SCAFFOLD_DIR = path.join(__dirname, '..', '.agents');

const HELP = `atlas-scaffold — bootstrap the agents-atlas convention into a project

Usage:
  npx atlas-scaffold [dir] [options]

  dir        target project directory (default: current directory)

Options:
  -f, --force        overwrite an existing .agents/ directory
  --no-link          do not create the .claude symlink
  --copy-claude      copy .claude instead of symlinking (Windows fallback)
  -v, --version      print version
  -h, --help         show this help

Examples:
  npx atlas-scaffold                      # install into current directory
  npx atlas-scaffold ../my-project --force
`;

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = {
    dir: null,
    force: false,
    link: true,
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
      case '--no-link':
        opts.link = false;
        break;
      case '--copy-claude':
        opts.copyClaude = true;
        break;
      default:
        if (arg.startsWith('-')) fail(`unknown option: ${arg}`);
        if (opts.dir) fail(`unexpected argument: ${arg}`);
        opts.dir = arg;
    }
  }
  return opts;
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function createClaudeLink(targetDir, { force, copyClaude }) {
  const claudePath = path.join(targetDir, '.claude');
  const exists = fs.existsSync(claudePath) || fs.lstatSync(claudePath, { throwIfNoEntry: false });

  if (exists) {
    if (!force) {
      console.warn(`warn: ${path.join(targetDir, '.claude')} already exists — leaving it untouched (use --force to replace)`);
      return false;
    }
    fs.rmSync(claudePath, { recursive: true, force: true });
  }

  if (copyClaude || process.platform === 'win32') {
    // Junction on Windows avoids needing admin privileges; copy is the safest fallback.
    copyDir(path.join(SCAFFOLD_DIR), claudePath);
    console.log(`+ ${path.join(targetDir, '.claude')} (copied)`);
    return true;
  }

  fs.symlinkSync('.agents', claudePath, 'dir');
  console.log(`+ ${path.join(targetDir, '.claude')} -> .agents (symlink)`);
  return true;
}

function main(argv) {
  const opts = parseArgs(argv);
  const targetDir = path.resolve(opts.dir || '.');

  if (!fs.existsSync(SCAFFOLD_DIR)) {
    fail('internal error: scaffold payload (.agents) missing from package');
  }
  if (!fs.existsSync(targetDir)) {
    fail(`target directory does not exist: ${targetDir}`);
  }
  if (!fs.statSync(targetDir).isDirectory()) {
    fail(`target is not a directory: ${targetDir}`);
  }

  const agentsPath = path.join(targetDir, '.agents');
  if (fs.existsSync(agentsPath)) {
    if (!opts.force) {
      fail(`${agentsPath} already exists — rerun with --force to overwrite`);
    }
    fs.rmSync(agentsPath, { recursive: true, force: true });
    console.log(`~ ${agentsPath} (replaced)`);
  }

  copyDir(SCAFFOLD_DIR, agentsPath);
  console.log(`+ ${agentsPath}`);

  if (opts.link) {
    createClaudeLink(targetDir, { force: opts.force, copyClaude: opts.copyClaude });
  }

  console.log(`\nDone. agents-atlas convention installed in ${targetDir}`);
  console.log('Next: read .agents/atlas/README.md, then create .agents/atlas/plans/01/PLAN.md before starting work.');
}

module.exports = { main, parseArgs };
