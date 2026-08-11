'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BIN = path.join(__dirname, '..', 'bin', 'init-atlas.js');
const ROOT = path.join(__dirname, '..');

let failures = 0;

function run(args, cwd) {
  return spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' });
}

function check(name, cond, extra) {
  if (cond) {
    console.log(`ok   - ${name}`);
  } else {
    failures++;
    console.error(`FAIL - ${name}${extra ? `\n       ${extra}` : ''}`);
  }
}

function makeTmp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `atlas-scaffold-${prefix}-`));
}

// 1. fresh install into a temp dir
{
  const dir = makeTmp('install');
  const res = run([dir], ROOT);
  check('fresh install exits 0', res.status === 0, res.stderr);
  check('.agents/atlas/README.md copied', fs.existsSync(path.join(dir, '.agents', 'atlas', 'README.md')));
  check('.agents/skills/agents-atlas/SKILL.md copied', fs.existsSync(path.join(dir, '.agents', 'skills', 'agents-atlas', 'SKILL.md')));
  const st = fs.lstatSync(path.join(dir, '.claude'));
  check('.claude is a symlink', st.isSymbolicLink(), JSON.stringify(st));
  check('.claude points at .agents', fs.readlinkSync(path.join(dir, '.claude')) === '.agents', fs.readlinkSync(path.join(dir, '.claude')));
  check('tmp scratch is present', fs.existsSync(path.join(dir, '.agents', 'atlas', 'tmp', '.gitkeep')));
}

// 2. existing .agents without --force -> error
{
  const dir = makeTmp('existing');
  fs.mkdirSync(path.join(dir, '.agents'), { recursive: true });
  const res = run([dir], ROOT);
  check('existing .agents aborts without --force', res.status !== 0, `status=${res.status}`);
  check('error message mentions --force', /--force/.test(res.stderr), res.stderr);
}

// 3. --force replaces existing .agents and keeps .claude intact
{
  const dir = makeTmp('force');
  fs.mkdirSync(path.join(dir, '.agents'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.agents', 'stale.txt'), 'stale');
  const res = run([dir, '--force'], ROOT);
  check('--force exits 0', res.status === 0, res.stderr);
  check('stale content gone', !fs.existsSync(path.join(dir, '.agents', 'stale.txt')));
  check('scaffold restored', fs.existsSync(path.join(dir, '.agents', 'atlas', 'README.md')));
}

// 4. --no-link skips .claude
{
  const dir = makeTmp('nolink');
  const res = run([dir, '--no-link'], ROOT);
  check('--no-link exits 0', res.status === 0, res.stderr);
  check('.claude not created', !fs.existsSync(path.join(dir, '.claude')));
}

// 5. --copy-claude copies instead of symlinking
{
  const dir = makeTmp('copyclaude');
  const res = run([dir, '--copy-claude'], ROOT);
  check('--copy-claude exits 0', res.status === 0, res.stderr);
  const st = fs.lstatSync(path.join(dir, '.claude'));
  check('.claude is a real dir (copy)', !st.isSymbolicLink() && st.isDirectory());
  check('copy contains skill', fs.existsSync(path.join(dir, '.claude', 'skills', 'agents-atlas', 'SKILL.md')));
}

// 6. default target = cwd
{
  const dir = makeTmp('cwd');
  const res = run([], dir);
  check('cwd install exits 0', res.status === 0, res.stderr);
  check('.agents created in cwd', fs.existsSync(path.join(dir, '.agents', 'atlas', 'README.md')));
}

// 7. help + version
{
  const help = run(['--help'], ROOT);
  check('--help exits 0', help.status === 0);
  check('--help shows usage', /npx @pasc4le-labs\/init-atlas/.test(help.stdout), help.stdout);
  const ver = run(['--version'], ROOT);
  check('--version prints semver', /^\d+\.\d+\.\d+/.test(ver.stdout.trim()), ver.stdout);
}

console.log(failures === 0 ? '\nAll tests passed' : `\n${failures} test(s) failed`);
process.exit(failures === 0 ? 0 : 1);
