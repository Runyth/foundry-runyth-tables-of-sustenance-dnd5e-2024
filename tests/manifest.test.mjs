// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
// Manifest, URL, and package-integrity checks for Runyth Tables of Sustenance - D&D 5e 2024.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = (name) => path.join(root, name);
const readJson = (name) => JSON.parse(readFileSync(repo(name), "utf8"));

const manifest = readJson("module.json");
const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");

test("manifest identity", () => {
  assert.equal(manifest.id, "runyth-tables-of-sustenance-dnd5e-2024");
  assert.equal(manifest.title, "Runyth Tables of Sustenance - D&D 5e 2024");
  assert.equal(manifest.authors.length, 1);
  assert.equal(manifest.authors[0].name, "Runyth");
});

test("manifest URL surfaces", () => {
  const version = manifest.version;
  assert.equal(manifest.license, "LICENSE");
  assert.equal(manifest.readme, "README.md");
  assert.equal(manifest.changelog, "CHANGELOG.md");
  assert.equal(manifest.url, "https://github.com/Runyth/foundry-runyth-tables-of-sustenance-dnd5e-2024");
  assert.equal(manifest.manifest, "https://github.com/Runyth/foundry-runyth-tables-of-sustenance-dnd5e-2024/releases/latest/download/module.json");
  assert.equal(
    manifest.download,
    `https://github.com/Runyth/foundry-runyth-tables-of-sustenance-dnd5e-2024/releases/download/v${version}/runyth-tables-of-sustenance-dnd5e-2024-v${version}-mod.zip`
  );
});

test("package metadata agrees with the manifest", () => {
  assert.equal(packageJson.name, manifest.id);
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.type, "module");
  assert.equal(packageJson.version, manifest.version);
  assert.equal(packageJson.license, "AGPL-3.0-or-later");
  assert.ok(packageJson.engines.node.includes("22.13.0"));
  assert.equal(packageLock.packages[""].version, manifest.version);
  assert.equal(packageLock.packages[""].license, "AGPL-3.0-or-later");
  assert.equal(packageLock.name, manifest.id);
});

test("the core dependency targets the published family core", () => {
  const requires = manifest.relationships.requires;
  assert.equal(requires.length, 1);
  assert.equal(requires[0].id, "runyth-tables-of-sustenance");
  assert.equal(requires[0].type, "module");
  assert.equal(requires[0].compatibility.minimum, "1.1.0");
  assert.ok(manifest.relationships.systems.some((row) => row.id === "dnd5e"));
});

test("manifest runtime files", () => {
  assert.equal(manifest.compatibility.minimum, "13.347");
  assert.equal(manifest.compatibility.verified, "13.351");
  assert.equal(manifest.compatibility.maximum, "13");
  for (const entry of manifest.esmodules) assert.ok(existsSync(repo(entry)));
  for (const style of manifest.styles) assert.ok(existsSync(repo(style)));
  for (const language of manifest.languages) {
    assert.ok(existsSync(repo(language.path)));
    assert.doesNotThrow(() => JSON.parse(readFileSync(repo(language.path), "utf8")));
  }
  assert.ok(existsSync(repo("data/core-food-contract.json")));
  assert.ok(existsSync(repo("README.md")));
  assert.ok(existsSync(repo("CHANGELOG.md")));
});

test("the localization namespace follows its module naming contract", () => {
  for (const language of manifest.languages) {
    const data = JSON.parse(readFileSync(repo(language.path), "utf8"));
    for (const key of Object.keys(data)) {
      assert.match(key, /^runyth-tables-of-sustenance-dnd5e-2024$/, `${language.path} wrapper key ${key}`);
    }
  }
});
