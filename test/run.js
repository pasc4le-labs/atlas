'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BIN = path.join(__dirname, '..', 'bin', 'atlas.js');
const ROOT = path.join(__dirname, '..');
const SKILL_CMD = 'npx skills add';

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
  return fs.mkdtempSync(path.join(os.tmpdir(), `atlas-init-${prefix}-`));
}

const ATLAS_MARKERS = ['README.md', 'plans/.gitkeep', 'topics/.gitkeep', 'tmp/.gitkeep'];

function atlasInstalled(dir) {
  return ATLAS_MARKERS.every((m) => fs.existsSync(path.join(dir, m)));
}

// 1. default non-interactive: installs to .agents/atlas, prints skill command
{
  const dir = makeTmp('default');
  const res = run([dir], ROOT);
  check('default exits 0', res.status === 0, res.stderr);
  check('installs into .agents/atlas', atlasInstalled(path.join(dir, '.agents', 'atlas')));
  check('no .claude created', !fs.existsSync(path.join(dir, '.claude')));
  check('prints skill command', res.stdout.includes(SKILL_CMD), res.stdout);
}

// 2. --dest installs to a custom location
{
  const dir = makeTmp('dest');
  const res = run([dir, '--dest', '.atlas'], ROOT);
  check('--dest exits 0', res.status === 0, res.stderr);
  check('installs into .atlas', atlasInstalled(path.join(dir, '.atlas')));
  check('does not create .agents', !fs.existsSync(path.join(dir, '.agents')));
  check('output shows location', /\.atlas/.test(res.stdout), res.stdout);
}

// 3. --dest nested path creates parent dirs
{
  const dir = makeTmp('nested');
  const res = run([dir, '--dest', '.claude/agents'], ROOT);
  check('nested --dest exits 0', res.status === 0, res.stderr);
  check('installs into .claude/agents', atlasInstalled(path.join(dir, '.claude', 'agents')));
}

// 4. existing dest, non-interactive: declined, untouched, warns
{
  const dir = makeTmp('decline');
  fs.mkdirSync(path.join(dir, '.agents', 'atlas'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.agents', 'atlas', 'marker.txt'), 'keep me');
  const res = run([dir], ROOT);
  check('declined overwrite exits 0', res.status === 0, res.stderr);
  check('existing dest untouched', fs.readFileSync(path.join(dir, '.agents', 'atlas', 'marker.txt'), 'utf8') === 'keep me');
  check('no template files added', !fs.existsSync(path.join(dir, '.agents', 'atlas', 'README.md')));
  check('warning printed', /already present/.test(res.stderr), res.stderr);
}

// 5. --dest + --force: overwritten
{
  const dir = makeTmp('force');
  fs.mkdirSync(path.join(dir, '.atlas'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.atlas', 'marker.txt'), 'stale');
  const res = run([dir, '--dest', '.atlas', '--force'], ROOT);
  check('--force exits 0', res.status === 0, res.stderr);
  check('stale marker gone', !fs.existsSync(path.join(dir, '.atlas', 'marker.txt')));
  check('template restored', fs.existsSync(path.join(dir, '.atlas', 'README.md')));
}

// 6. --no-skill: no skill command printed
{
  const dir = makeTmp('noskill');
  const res = run([dir, '--no-skill'], ROOT);
  check('--no-skill exits 0', res.status === 0, res.stderr);
  check('no skill command in stdout', !res.stdout.includes(SKILL_CMD), res.stdout);
  check('atlas still installed', atlasInstalled(path.join(dir, '.agents', 'atlas')));
}

// 7. --quiet: no stdout
{
  const dir = makeTmp('quiet');
  const res = run([dir, '--quiet'], ROOT);
  check('--quiet exits 0', res.status === 0, res.stderr);
  check('--quiet prints nothing', res.stdout.trim() === '', JSON.stringify(res.stdout));
  check('files still installed', atlasInstalled(path.join(dir, '.agents', 'atlas')));
}

// 8. default target = cwd
{
  const dir = makeTmp('cwd');
  const res = run([], dir);
  check('cwd install exits 0', res.status === 0, res.stderr);
  check('installs into cwd/.agents/atlas', atlasInstalled(path.join(dir, '.agents', 'atlas')));
}

// 9. help + version + unknown option
{
  const help = run(['--help'], ROOT);
  check('--help exits 0', help.status === 0);
  check('--help shows usage', help.stdout.includes('npx ' + require(path.join(ROOT, 'package.json')).name), help.stdout);
  const ver = run(['--version'], ROOT);
  check('--version prints semver', /^\d+\.\d+\.\d+/.test(ver.stdout.trim()), ver.stdout);
  const bad = run(['--bogus'], ROOT);
  check('unknown option fails', bad.status !== 0);
  const missing = run(['--dest'], ROOT);
  check('--dest without value fails', missing.status !== 0);
}

console.log(failures === 0 ? '\nAll tests passed' : `\n${failures} test(s) failed`);
process.exit(failures === 0 ? 0 : 1);
