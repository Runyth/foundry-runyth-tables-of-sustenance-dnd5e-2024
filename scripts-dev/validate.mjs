// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const manifest = json("module.json");
const pkg = json("package.json");
const contract = json("data/core-food-contract.json");
const errors = [];
const required = manifest.relationships?.requires ?? [];
const systems = manifest.relationships?.systems ?? [];
const allowedManifestKeys = new Set([
  "id", "title", "description", "version", "authors", "compatibility", "relationships",
  "esmodules", "scripts", "styles", "languages", "socket", "manifest", "download", "license",
  "readme", "bugs", "changelog", "url", "media", "packs", "packFolders", "flags",
  "persistentStorage", "protected", "exclusive", "coreTranslation", "documentTypes", "library"
]);
const unknownManifestKeys = Object.keys(manifest).filter(key => !allowedManifestKeys.has(key));
assert(unknownManifestKeys.length === 0, `Unknown Foundry v13 module manifest keys: ${unknownManifestKeys.join(", ")}`);
assert(manifest.id === "runyth-tables-of-sustenance-dnd5e-2024", "Unexpected module id.");
assert(manifest.version === pkg.version, "Manifest/package versions differ.");
assert(manifest.compatibility.minimum === "13.347" && manifest.compatibility.verified === "13.351" && manifest.compatibility.maximum === "13", "Foundry v13 compatibility declaration is invalid.");
assert(required.some(entry => entry.id === "runyth-tables-of-sustenance" && entry.type === "module" && entry.compatibility?.minimum === "1.1.0"), "Core dependency is missing or too old.");
assert(systems.some(entry => entry.id === "dnd5e" && entry.type === "system" && entry.compatibility?.minimum === "5.3.0" && entry.compatibility?.verified === "5.3.3"), "D&D 5e 5.3 system relationship is invalid.");
assert(contract.foods.length === 335, `Expected 335 core food contracts, found ${contract.foods.length}.`);
assert(new Set(contract.foods.map(food => food.sourceId)).size === 335, "Core food contract contains duplicate source IDs.");
assert(contract.foods.filter(food => food.tier === "1").length === 180, "Tier 1 coverage mismatch.");
assert(contract.foods.filter(food => food.intentKinds.length > 0).length === 155, "Mechanical food coverage should be 155 foods.");
const runtime = ["scripts/main.mjs", "scripts/api.mjs", "scripts/adapter.mjs", "scripts/roll-bonus.mjs"]
  .map(path => readFileSync(join(root, path), "utf8"))
  .join("\n");
assert(!runtime.includes("new FilePicker") && !runtime.includes("globalThis.FilePicker"), "Deprecated global FilePicker usage detected.");
assert(runtime.includes('system.attributes.hp.tempmax'), "Maximum-vitality mapping must use a D&D 5e-supported Active Effect path.");
assert(runtime.includes('result.dhd') && runtime.includes('result.deltas?.hitDice') && !runtime.includes('diceSpent'), "Short-rest recovery must use the D&D 5.3 RestResult hit-die delta contract.");
assert(runtime.includes('dnd5e.preRollSkill') && runtime.includes('dnd5e.preRollSavingThrow'), "D&D 5.3 contextual roll hooks are missing.");
assert(!runtime.includes('dnd5e.preRollAbilitySave'), "Obsolete D&D ability-save hook name detected.");
assert(runtime.includes('config?.subject'), "D&D 5.3 roll actor resolution must use the process configuration subject.");
assert(!runtime.includes('actor?.getFlag'), "Unsafe optional getFlag invocation on an unvalidated hook argument detected.");
for (const path of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map(value => value.path)]) assert(existsSync(join(root, path)), `Missing manifest path: ${path}`);
const report = { generatedAt: new Date().toISOString(), moduleVersion: manifest.version, status: errors.length ? "failed" : "passed", foundry: manifest.compatibility, coreFoods: contract.foods.length, mechanicalFoods: contract.foods.filter(food => food.intentKinds.length).length, errors };
writeFileSync(join(root, "docs/reports/validation-report.json"), JSON.stringify(report, null, 2) + "\n");
if (errors.length) { errors.forEach(error => console.error(`ERROR: ${error}`)); process.exitCode = 1; }
else console.log("Validated D&D 5e integration manifest, 335-food contract, D&D 5.3 roll-hook contract, effect coverage, v13 API scan, and max-HP compatibility mapping.");
function json(path) { return JSON.parse(readFileSync(join(root, path), "utf8")); }
function assert(value, message) { if (!value) errors.push(message); }
