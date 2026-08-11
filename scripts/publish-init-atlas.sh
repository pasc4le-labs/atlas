#!/usr/bin/env bash
# Build and publish the unscoped `init-atlas` alias of @pasc4le-labs/atlas.
# Run after bumping the version in package.json; keeps both names in sync.
set -euo pipefail
cd "$(dirname "$0")/.."

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git archive HEAD | tar -x -C "$TMP"

node -e '
const fs = require("fs");
const dir = process.argv[1];
const p = dir + "/package.json";
const pkg = JSON.parse(fs.readFileSync(p, "utf8"));
if (!pkg.name.startsWith("@")) {
  console.error("expected scoped package in repo, got: " + pkg.name);
  process.exit(1);
}
pkg.name = "init-atlas";
pkg.bin = { "init-atlas": "bin/atlas.js" };
fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n");
console.log("built init-atlas@" + pkg.version);
' "$TMP"

(cd "$TMP" && npm publish --access public)
