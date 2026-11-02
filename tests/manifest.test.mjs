// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const manifest = JSON.parse(await readFile(new URL("../module.json", import.meta.url), "utf8"));
const contract = JSON.parse(await readFile(new URL("../data/core-food-contract.json", import.meta.url), "utf8"));

test("requires the system-neutral core and D&D 5e 5.3", () => {
  assert.equal(manifest.compatibility.maximum, "13");
  assert.ok(manifest.relationships.requires.some(entry => entry.id === "runyth-tables-of-sustenance" && entry.type === "module"));
  assert.equal(Object.hasOwn(manifest, "system"), false);
  assert.ok(manifest.relationships.systems.some(entry => entry.id === "dnd5e" && entry.type === "system"));
});

test("covers all core foods while only 155 require mechanical intent handling", () => {
  assert.equal(contract.foods.length, 335);
  assert.equal(contract.foods.filter(food => food.intentKinds.length > 0).length, 155);
  assert.equal(contract.foods.filter(food => food.tier === "1").length, 180);
});
