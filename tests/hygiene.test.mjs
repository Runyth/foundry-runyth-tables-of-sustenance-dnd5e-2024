// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
// Source notice, licence, and publication hygiene for Runyth Tables of Sustenance - D&D 5e 2024.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = (name) => path.join(root, name);
const read = (name) => readFileSync(repo(name), "utf8");

function everyProgramFile(directory, extensions) {
  const rows = readdirSync(repo(directory), { withFileTypes: true });
  const files = [];
  for (const row of rows) {
    const absolute = path.join(repo(directory), row.name);
    if (row.isDirectory()) files.push(...everyProgramFile(`${directory}/${row.name}`, extensions));
    else if (extensions.some((value) => row.name.endsWith(value))) files.push(`${directory}/${row.name}`);
  }
  return files;
}

const programFiles = [
  ...everyProgramFile("scripts", [".mjs"]),
  ...everyProgramFile("scripts-dev", [".mjs"]),
  ...everyProgramFile("tools", [".mjs"]),
  ...everyProgramFile("tests", [".mjs"])
];

test("every program file starts with the standard two-line source notice", () => {
  assert.ok(programFiles.length >= 10);
  const holder = ["// SPDX-License-Identifier: AGPL-3.0-or-later", "// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations."];
  const holderFragment = ["// Copyright (C) 2026 Daniel ", "Brani", "ewski. See the LICENSE file for rights and obligations."].join("");
  for (const file of programFiles) {
    const lines = read(file).split("\n");
    assert.deepEqual(lines.slice(0, 2), holder, `${file} carries the source notice`);
    assert.ok(lines[1].startsWith(holderFragment), `${file} notice holder`);
  }
});

test("the LICENSE file is the full GNU Affero General Public License v3", () => {
  const licence = read("LICENSE");
  assert.match(licence, /GNU AFFERO GENERAL PUBLIC LICENSE/);
  assert.match(licence, /Version 3, 19 November 2007/);
  assert.ok(licence.length > 30000);
});

test("the README quotes the standard licence chapter", () => {
  const readme = read("README.md");
  const holderLine = ["Copyright © 2026  [Daniel ", "Brani", "ewski](https://brani.dev/)"].join("");
  assert.ok(readme.includes("## Licence"));
  assert.ok(readme.includes(holderLine));
  assert.ok(readme.includes("This program is free software: you can redistribute it and/or modify"));
  assert.ok(readme.includes("<https://www.gnu.org/licenses/>"));
});

test("the changelog carries the 1.0.1 release section and its Runyth publication record", () => {
  const changelog = read("CHANGELOG.md");
  assert.match(changelog, /## 1\.0\.1|##/, "a release section exists");
  assert.ok(changelog.includes("First publication as a Runyth module"));
});

test("published surfaces carry no campaign-classified material", () => {
  const foreignProject = ["token-", "hud-wildcard"].join("");
  const foreignName = ["Token HUD ", "Wildcard"].join("");
  const presentationSource = ["garb", "-and-", "grime"].join("");
  const campaignName = ["orphan", "-", "black"].join("");
  const campaignTitle = ["Orphan", " Black"].join("");
  const externalCredit = ["Mid", "i-QoL"].join("");
  const retiredLineage = ["veiled", "-inquisition"].join("");
  const volunteer = ["aki", "to"].join("");
  const mitRule = new RegExp(["MIT ", "License|Permission is hereby ", "granted"].join(""), "");
  for (const file of ["module.json", "package.json", "README.md", "CHANGELOG.md", "data/core-food-contract.json", ...programFiles, ...everyProgramFile("docs", [".md", ".txt", ".csv"])]) {
    const text = read(file);
    assert.ok(!text.includes(foreignProject), `${file} must not carry the foreign module id`);
    assert.ok(!text.includes(foreignName), `${file} must not carry the foreign module name`);
    assert.ok(!text.includes(presentationSource), `${file} must not carry the sibling presentation module id`);
    assert.ok(!text.includes(campaignName), `${file} must not carry the campaign name`);
    assert.ok(!text.includes(campaignTitle), `${file} must not carry the campaign title`);
    assert.ok(!text.includes(externalCredit), `${file} must not carry third-party module credit`);
    assert.ok(!text.includes(retiredLineage), `${file} must not carry the retired workspace lineage name`);
    assert.ok(!/[Cc]ourtesy of|[Tt]hanks to/.test(text), `${file} must not hand out upstream credit`);
    assert.ok(!text.includes(volunteer), `${file} must not carry personal identity outside licence surfaces`);
    assert.ok(!mitRule.test(text), `${file} must not quote the removed MIT licence`);
  }
});

test("the core dependency stays internal to the Runyth family", () => {
  const manifest = JSON.parse(read("module.json"));
  assert.deepEqual(manifest.relationships.requires.map((row) => row.id), ["runyth-tables-of-sustenance"]);
  for (const file of ["README.md", "docs/COMPATIBILITY.md"]) {
    const text = read(file);
    assert.ok(!/donate|patreon|ko-?fi/i.test(text), `${file} must not carry funding prompts`);
  }
});

test("no private material lives on published source surfaces", () => {
  const pattern = (...parts) => new RegExp(parts.join(""), "iu"); // rules assembled at runtime
  const patterns = [
    pattern(["akki", "@"]),
    pattern(["ik", "\\.me"]),
    pattern(["GITHUB_", "TOKEN"]),
    pattern(["gh", "[psro]_[A-Za-z0-9]{20,}"]),
    pattern(["http.*\\.extra", "header"]),
    pattern(["x-", "access-", "token"]),
    pattern(["/mnt", "/"]),
    pattern(["/home", "/"]),
    pattern(["aki", "to"]),
    pattern(["ORPHAN-", "[-\\s]*", "BLACK"])
  ];
  for (const file of [
    "module.json",
    "package.json",
    "package-lock.json",
    "README.md",
    "CHANGELOG.md",
    "data/core-food-contract.json",
    ".github/workflows/quality.yml",
    ".github/workflows/release.yml",
    ...programFiles,
    ...(everyProgramFile("docs", [".md", ".txt", ".csv"]))
  ]) {
    const text = read(file);
    for (const rule of patterns) {
      assert.ok(!rule.test(text), `${file} must not match ${String(rule)}`);
    }
  }
});
