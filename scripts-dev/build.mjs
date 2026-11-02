// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const moduleId = "runyth-tables-of-sustenance-dnd5e-2024";
const output = join(root, "dist", "module", moduleId);
rmSync(join(root, "dist", "module"), { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const entry of ["module.json", "LICENSE", "README.md", "scripts", "styles", "lang", "data"]) {
  if (!existsSync(join(root, entry))) throw new Error(`Missing runtime entry: ${entry}`);
  cpSync(join(root, entry), join(output, entry), { recursive: true });
}
const manifest = JSON.parse(readFileSync(join(root, "module.json"), "utf8"));
writeFileSync(join(output, "BUILD_INFO.json"), JSON.stringify({ moduleId, version: manifest.version, builtAt: null, reproducibleBuild: true, foundryCompatibility: manifest.compatibility, coreCompatibility: "^1.1.0", dnd5eCompatibility: "5.3.0-5.3.3", coveredCoreFoods: 335 }, null, 2) + "\n");
console.log(`Built installable D&D 5e integration at ${output}`);
