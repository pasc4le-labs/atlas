#!/usr/bin/env bash
# Build and publish the scoped `@pasc4le-labs/atlas` alias of init-atlas.
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
if (pkg.name.startsWith("@")) {
  console.error("expected unscoped package in repo, got: " + pkg.name);
  process.exit(1);
}
pkg.name = "@pasc4le-labs/atlas";
pkg.bin = { atlas: "bin/atlas.js" };
fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n");
console.log("built @pasc4le-labs/atlas@" + pkg.version);
' "$TMP"

(cd "$TMP" && npm publish --access public)
