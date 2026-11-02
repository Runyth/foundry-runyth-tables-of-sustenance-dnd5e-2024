// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import { readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const files = walk(join(root, "scripts")).filter(path => path.endsWith(".mjs"));
for (const file of files) execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
console.log(`Syntax checked ${files.length} runtime modules.`);
function walk(path) { return readdirSync(path).flatMap(name => { const child = join(path, name); return statSync(child).isDirectory() ? walk(child) : [child]; }); }
