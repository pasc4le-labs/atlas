'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BIN = path.join(__dirname, '..', 'bin', 'atlas.js');
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

// 1. fresh install into an empty dir: no .claude by default
{
  const dir = makeTmp('fresh');
  const res = run([dir], ROOT);
  check('fresh install exits 0', res.status === 0, res.stderr);
  check('.agents/atlas/README.md copied', fs.existsSync(path.join(dir, '.agents', 'atlas', 'README.md')));
  check('skill copied', fs.existsSync(path.join(dir, '.agents', 'skills', 'agents-atlas', 'SKILL.md')));
  check('.claude NOT created by default', !fs.existsSync(path.join(dir, '.claude')));
  check('output marks created', /atlas .*created/.test(res.stdout), res.stdout);
  check('tip mentions --claude', /--claude/.test(res.stdout), res.stdout);
}

// 2. --claude links .claude -> .agents
{
  const dir = makeTmp('claude');
  const res = run([dir, '--claude'], ROOT);
  check('--claude exits 0', res.status === 0, res.stderr);
  const st = fs.lstatSync(path.join(dir, '.claude'));
  check('.claude is a symlink', st.isSymbolicLink());
  check('.claude points at .agents', fs.readlinkSync(path.join(dir, '.claude')) === '.agents');
  check('output marks linked', /linked/.test(res.stdout), res.stdout);
}

// 3. existing non-empty .agents is merged, unrelated files preserved
{
  const dir = makeTmp('merge');
  fs.mkdirSync(path.join(dir, '.agents'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.agents', 'plans'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.agents', 'plans', 'keep.txt'), 'mine');
  const res = run([dir], ROOT);
  check('merge into existing .agents exits 0', res.status === 0, res.stderr);
  check('unrelated file preserved', fs.readFileSync(path.join(dir, '.agents', 'plans', 'keep.txt'), 'utf8') === 'mine');
  check('atlas created alongside', fs.existsSync(path.join(dir, '.agents', 'atlas', 'README.md')));
}

// 4. existing atlas, non-interactive: declined, left untouched, warns
{
  const dir = makeTmp('decline');
  fs.mkdirSync(path.join(dir, '.agents', 'atlas'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.agents', 'atlas', 'marker.txt'), 'keep me');
  const res = run([dir], ROOT);
  check('declined overwrite exits 0', res.status === 0, res.stderr);
  check('existing atlas untouched', fs.readFileSync(path.join(dir, '.agents', 'atlas', 'marker.txt'), 'utf8') === 'keep me');
  check('no template files added', !fs.existsSync(path.join(dir, '.agents', 'atlas', 'README.md')));
  check('warning printed', /already present/.test(res.stderr), res.stderr);
}

// 5. existing atlas + --force: overwritten
{
  const dir = makeTmp('force');
  fs.mkdirSync(path.join(dir, '.agents', 'atlas'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.agents', 'atlas', 'marker.txt'), 'stale');
  const res = run([dir, '--force'], ROOT);
  check('--force exits 0', res.status === 0, res.stderr);
  check('stale marker gone', !fs.existsSync(path.join(dir, '.agents', 'atlas', 'marker.txt')));
  check('template restored', fs.existsSync(path.join(dir, '.agents', 'atlas', 'README.md')));
}

// 6. existing skill + --yes: overwritten without prompt
{
  const dir = makeTmp('yes');
  fs.mkdirSync(path.join(dir, '.agents', 'skills', 'agents-atlas'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.agents', 'skills', 'agents-atlas', 'marker.txt'), 'stale');
  const res = run([dir, '--yes'], ROOT);
  check('--yes exits 0', res.status === 0, res.stderr);
  check('skill overwritten', fs.existsSync(path.join(dir, '.agents', 'skills', 'agents-atlas', 'SKILL.md')));
  check('stale skill marker gone', !fs.existsSync(path.join(dir, '.agents', 'skills', 'agents-atlas', 'marker.txt')));
}

// 7. existing .claude is never touched by default
{
  const dir = makeTmp('claude-preserve');
  fs.writeFileSync(path.join(dir, '.claude'), 'real file');
  const res = run([dir], ROOT);
  check('existing .claude exits 0', res.status === 0, res.stderr);
  check('.claude untouched by default', fs.readFileSync(path.join(dir, '.claude'), 'utf8') === 'real file');
}

// 8. existing .claude + --claude --force: replaced
{
  const dir = makeTmp('claude-force');
  fs.writeFileSync(path.join(dir, '.claude'), 'real file');
  const res = run([dir, '--claude', '--force'], ROOT);
  check('--claude --force exits 0', res.status === 0, res.stderr);
  const st = fs.lstatSync(path.join(dir, '.claude'));
  check('.claude replaced with symlink', st.isSymbolicLink());
}

// 9. --copy-claude implies linking, copies instead of symlinking
{
  const dir = makeTmp('copyclaude');
  const res = run([dir, '--copy-claude'], ROOT);
  check('--copy-claude exits 0', res.status === 0, res.stderr);
  const st = fs.lstatSync(path.join(dir, '.claude'));
  check('.claude is a real dir (copy)', !st.isSymbolicLink() && st.isDirectory());
}

// 10. --quiet: no stdout on success
{
  const dir = makeTmp('quiet');
  const res = run([dir, '--quiet'], ROOT);
  check('--quiet exits 0', res.status === 0, res.stderr);
  check('--quiet prints nothing to stdout', res.stdout.trim() === '', JSON.stringify(res.stdout));
  check('files still installed', fs.existsSync(path.join(dir, '.agents', 'atlas', 'README.md')));
}

// 11. default target = cwd
{
  const dir = makeTmp('cwd');
  const res = run([], dir);
  check('cwd install exits 0', res.status === 0, res.stderr);
  check('.agents created in cwd', fs.existsSync(path.join(dir, '.agents', 'atlas', 'README.md')));
}

// 12. help + version + unknown option
{
  const help = run(['--help'], ROOT);
  check('--help exits 0', help.status === 0);
  check('--help shows usage', help.stdout.includes('npx ' + require(path.join(ROOT, 'package.json')).name), help.stdout);
  const ver = run(['--version'], ROOT);
  check('--version prints semver', /^\d+\.\d+\.\d+/.test(ver.stdout.trim()), ver.stdout);
  const bad = run(['--bogus'], ROOT);
  check('unknown option fails', bad.status !== 0);
}

console.log(failures === 0 ? '\nAll tests passed' : `\n${failures} test(s) failed`);
process.exit(failures === 0 ? 0 : 1);
