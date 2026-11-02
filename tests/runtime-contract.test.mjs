import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const main = await readFile(new URL("../scripts/main.mjs", import.meta.url), "utf8");
const adapter = await readFile(new URL("../scripts/adapter.mjs", import.meta.url), "utf8");
const rollBonus = await readFile(new URL("../scripts/roll-bonus.mjs", import.meta.url), "utf8");

test("D&D 5.3 roll hooks use the process-configuration contract", () => {
  assert.match(main, /dnd5e\.preRollSavingThrow/);
  assert.match(main, /dnd5e\.preRollSkill/);
  assert.doesNotMatch(main, /dnd5e\.preRollAbilitySave/);
  assert.match(main, /\(config, dialog, message\)/);
  assert.match(rollBonus, /config\?\.subject/);
});

test("D&D hooks live only in the integration", () => {
  assert.match(main, /dnd5e\.preRollSavingThrow/);
  assert.match(main, /dnd5e\.preRollSkill/);
  assert.match(main, /dnd5e\.restCompleted/);
});

test("integration avoids deprecated v13 global FilePicker and private APIs", () => {
  assert.doesNotMatch(main + adapter + rollBonus, /\bnew\s+FilePicker\b|globalThis\.FilePicker|_private|foundry\._/);
});

test("short-rest recovery uses the D&D 5.3 RestResult hit-die delta contract", () => {
  assert.match(main, /result\.dhd/);
  assert.match(main, /result\.deltas\?\.hitDice/);
  assert.doesNotMatch(main, /diceSpent|hitDiceSpent/);
  assert.match(main, /Math\.max\(0, -delta\)/);
});

test("async hook work is rejection-safe", () => {
  assert.match(main, /reportAsyncError/);
  assert.match(main, /\.catch\(error => reportAsyncError/);
});

test("roll bonus helper never invokes getFlag through optional chaining on arbitrary hook arguments", () => {
  assert.doesNotMatch(main + rollBonus, /actor\?\.getFlag/);
  assert.match(rollBonus, /typeof candidate\.getFlag === "function"/);
  assert.match(rollBonus, /typeof candidate\.unsetFlag === "function"/);
});
