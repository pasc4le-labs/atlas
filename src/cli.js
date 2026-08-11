'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');

const pkg = require('../package.json');
const VERSION = pkg.version;
const PKG_NAME = pkg.name;
const SCAFFOLD_DIR = path.join(__dirname, '..', '.agents');
const SKILL_SOURCE =
  'https://github.com/pasc4le-labs/atlas/tree/main/.agents/skills/atlas';
const SKILL_CMD = `npx skills add ${SKILL_SOURCE}`;

const CUSTOM = '__custom__';

const DEST_CHOICES = [
  { label: '.agents/atlas', value: '.agents/atlas', hint: 'inside the agents convention (default)' },
  { label: '.atlas', value: '.atlas', hint: 'top-level project dir' },
  { label: '.claude/agents', value: '.claude/agents', hint: 'Claude Code dir' },
  { label: '.codex/atlas', value: '.codex/atlas', hint: 'Codex CLI dir' },
  { label: '.docs/', value: '.docs', hint: 'docs location' },
  { label: '.ai/', value: '.ai', hint: 'AI working dir' },
  { label: '.config/atlas', value: '.config/atlas', hint: 'config location' },
  { label: 'Custom path', value: CUSTOM, hint: 'enter your own' },
];

const SKILL_CHOICES = [
  { label: 'Install now', value: 'install', hint: `runs: ${SKILL_CMD}` },
  { label: 'Print command', value: 'print', hint: 'run it yourself later' },
  { label: 'Skip', value: 'skip', hint: 'no skill install' },
];

const HELP = `atlas: bootstrap the agents-atlas convention into a project

Usage:
  npx ${PKG_NAME} [project] [options]

  project    target project directory (default: current directory)

Options:
  --dest <path>     install atlas to a specific path (skips the selector)
  --force           overwrite existing files without asking
  --yes             assume yes for all confirmation prompts
  --no-skill        skip the skill install prompt entirely
  --with-skill      run the skill install without asking
  --quiet           suppress success output
  -v, --version     print version
  -h, --help        show this help

Examples:
  npx ${PKG_NAME}                        # interactive install into current dir
  npx ${PKG_NAME} ../proj --dest .atlas --no-skill
`;

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = (s) => paint('32', s);
const yellow = (s) => paint('33', s);
const red = (s) => paint('31', s);
const cyan = (s) => paint('36', s);
const dim = (s) => paint('2', s);
const bold = (s) => paint('1', s);

const ANSI = {
  up: (n) => `\x1b[${n}A`,
  down: (n) => `\x1b[${n}B`,
  col0: '\x1b[G',
  clear: '\x1b[2K',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
};

function fail(message) {
  console.error(`${red('error')}: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = {
    project: null,
    dest: null,
    force: false,
    yes: false,
    quiet: false,
    noSkill: false,
    withSkill: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
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
      case '--no-skill':
        opts.noSkill = true;
        break;
      case '--with-skill':
        opts.withSkill = true;
        break;
      case '--dest':
        if (i + 1 >= argv.length) fail('--dest requires a path argument');
        opts.dest = argv[++i];
        break;
      default:
        if (arg.startsWith('-')) fail(`unknown option: ${arg}`);
        if (opts.project) fail(`unexpected argument: ${arg}`);
        opts.project = arg;
    }
  }
  return opts;
}

let keypressBound = false;
function ensureKeypressEvents() {
  if (!keypressBound) {
    readline.emitKeypressEvents(process.stdin);
    keypressBound = true;
  }
}

// Interactive arrow-key selector. Resolves the chosen value, CUSTOM sentinel,
// or null if aborted / not a TTY.
function select(prompt, choices) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) return resolve(null);
    const out = process.stdout;
    const height = choices.length;
    ensureKeypressEvents();
    process.stdin.setRawMode(true);
    process.stdin.resume();
    out.write(ANSI.hideCursor);

    let index = 0;

    // Prompt line, then one blank line per choice; cursor parked on the
    // last choice line.
    out.write(`${bold(prompt)}\n`);
    for (let i = 0; i < height; i++) out.write('\n');
    out.write(ANSI.up(1));

    const render = () => {
      out.write(ANSI.up(height - 1));
      for (let i = 0; i < height; i++) {
        out.write(ANSI.col0 + ANSI.clear);
        const c = choices[i];
        const marker = i === index ? green('❯') : ' ';
        const label = i === index ? cyan(bold(c.label)) : c.label;
        out.write(`${marker} ${label}${c.hint ? dim(`  ${c.hint}`) : ''}`);
        if (i < height - 1) out.write(ANSI.down(1));
      }
      out.write(ANSI.col0);
    };

    const finish = (answer, aborted) => {
      process.stdin.setRawMode(false);
      process.stdin.removeListener('keypress', onKeypress);
      out.write(ANSI.showCursor);
      out.write(ANSI.up(height - 1)); // to first choice line
      for (let i = 0; i < height; i++) {
        out.write(ANSI.col0 + ANSI.clear);
        if (i < height - 1) out.write(ANSI.down(1));
      }
      out.write(ANSI.up(height)); // to prompt line
      out.write(ANSI.col0 + ANSI.clear);
      if (aborted) {
        out.write(`${yellow('✖')} ${prompt} aborted\n`);
      } else {
        out.write(`${green('✔')} ${prompt} ${bold(choices[index].label)}\n`);
      }
      resolve(answer);
    };

    const onKeypress = (str, key) => {
      if (key.name === 'up' || key.name === 'k') {
        index = (index - 1 + height) % height;
        render();
      } else if (key.name === 'down' || key.name === 'j') {
        index = (index + 1) % height;
        render();
      } else if (key.name === 'return' || key.name === 'enter') {
        finish(choices[index].value, false);
      } else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
        finish(null, true);
      }
    };

    process.stdin.on('keypress', onKeypress);
    render();
  });
}

function promptInput(question) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) return resolve(null);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${bold(question)} `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
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

function expandPath(input) {
  if (input.startsWith('~/')) return path.join(os.homedir(), input.slice(2));
  return input;
}

async function installAtlas(destPath, destLabel, opts, say) {
  const src = path.join(SCAFFOLD_DIR, 'atlas');
  const present = fs.existsSync(destPath);
  if (present && !opts.force && !opts.yes) {
    const ok = await askConfirm(`${destLabel} already exists. Overwrite it?`);
    if (!ok) {
      console.warn(`${yellow('!')} ${dim(destLabel)} already present; left untouched`);
      return 'skipped';
    }
  }
  if (present) {
    fs.rmSync(destPath, { recursive: true, force: true });
  }
  fs.cpSync(src, destPath, { recursive: true, force: true });
  say(`${green('✓')} ${dim(destLabel)} ${present ? 'updated' : 'created'}`);
  return present ? 'updated' : 'created';
}

function runSkills() {
  return new Promise((resolve, reject) => {
    const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const child = spawn(cmd, ['skills', 'add', SKILL_SOURCE], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npx skills exited with code ${code}`));
    });
  });
}

async function main(argv) {
  const opts = parseArgs(argv);
  const projectDir = path.resolve(opts.project || '.');
  const say = (msg) => {
    if (!opts.quiet) console.log(msg);
  };

  if (!fs.existsSync(SCAFFOLD_DIR)) {
    fail('internal error: scaffold payload (.agents) missing from package');
  }
  if (!fs.existsSync(projectDir)) {
    fail(`target project does not exist: ${projectDir}`);
  }
  if (!fs.statSync(projectDir).isDirectory()) {
    fail(`target is not a directory: ${projectDir}`);
  }

  // 1. Destination selection
  let dest = opts.dest;
  if (!dest) {
    if (process.stdin.isTTY && process.stdout.isTTY) {
      const value = await select('Where should the atlas convention live?', DEST_CHOICES);
      if (value === null) fail('aborted');
      if (value === CUSTOM) {
        const input = await promptInput('Custom path (relative to project, or absolute):');
        if (!input) fail('no path provided');
        dest = expandPath(input);
      } else {
        dest = value;
      }
    } else {
      dest = '.agents/atlas'; // sensible default in non-interactive contexts
    }
  }

  const destPath = path.isAbsolute(dest) ? dest : path.join(projectDir, dest);
  const destLabel = path.relative(projectDir, destPath) || dest;

  // 2. Install the atlas convention
  await installAtlas(destPath, destLabel, opts, say);

  // 3. Skill installation (interactive via npx skills)
  let skillAction = null;
  if (!opts.noSkill) {
    if (opts.withSkill) {
      skillAction = 'install';
    } else if (process.stdin.isTTY && process.stdout.isTTY) {
      skillAction = await select('Install the atlas skill with npx skills?', SKILL_CHOICES);
    }
    // non-TTY without --with-skill: skillAction stays null -> print command

    if (skillAction === 'install') {
      say(`${green('▶')} Running ${dim(SKILL_CMD)}`);
      try {
        await runSkills();
        say(`${green('✓')} atlas skill installed`);
      } catch (err) {
        console.warn(`${yellow('!')} skill install failed: ${err.message}`);
        console.log(`\n  You can install it yourself:\n\n  ${SKILL_CMD}\n`);
      }
    } else if (skillAction === 'print' || skillAction === null) {
      if (!opts.quiet) {
        console.log(`\n${bold('Skill install command:')}\n\n  ${SKILL_CMD}\n`);
      }
    }
    // 'skip' -> nothing
  }

  // 4. Summary
  if (!opts.quiet) {
    console.log(`${green('Done')}. Atlas convention installed in ${bold(projectDir)}`);
    console.log(`  Location: ${dim(destLabel)}`);
    if (!opts.noSkill) {
      const status =
        skillAction === 'install' ? green('installed') : skillAction === 'skip' ? dim('skipped') : dim('see command above');
      console.log(`  Skill: ${status}`);
    }
    console.log(`Next: read ${dim(destLabel + '/README.md')}, then create ${dim(destLabel + '/plans/01/PLAN.md')} before starting work.`);
  }
}

module.exports = { main, parseArgs, select, installAtlas };

if (require.main === module) {
  main(process.argv.slice(2)).catch((err) => fail(err.message));
}
