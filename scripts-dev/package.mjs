import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const moduleId = "runyth-tables-of-sustenance-dnd5e-2024";
const version = JSON.parse(readFileSync(join(root, "module.json"), "utf8")).version;
const dist = join(root, "dist");
const staging = join(dist, "staging");
execFileSync(process.execPath, [join(root, "scripts-dev/build.mjs")], { stdio: "inherit" });
rmSync(staging, { recursive: true, force: true }); mkdirSync(staging, { recursive: true });
const installStage = join(staging, "installable", moduleId); cpSync(join(dist, "module", moduleId), installStage, { recursive: true }); zip(join(staging, "installable"), join(dist, `${moduleId}-v${version}-installable.zip`));
const sourceStage = join(staging, "source", moduleId); mkdirSync(sourceStage, { recursive: true }); for (const entry of readdirSync(root)) { if (["dist", ".git", "node_modules"].includes(entry)) continue; cpSync(join(root, entry), join(sourceStage, entry), { recursive: true }); } zip(join(staging, "source"), join(dist, `${moduleId}-v${version}-source.zip`));
const docsName = `${moduleId}-v${version}-documentation-audit`; const docsStage = join(staging, "documentation", docsName); mkdirSync(docsStage, { recursive: true }); cpSync(join(root, "docs"), join(docsStage, "docs"), { recursive: true }); for (const entry of ["README.md", "module.json", "LICENSE"]) cpSync(join(root, entry), join(docsStage, entry), { recursive: true }); cpSync(join(root, "data/core-food-contract.json"), join(docsStage, "core-food-contract.json")); zip(join(staging, "documentation"), join(dist, `${docsName}.zip`));
console.log("Created D&D integration release archives.");
function zip(cwd, destination) { rmSync(destination, { force: true }); execFileSync("python3", [join(root, "scripts-dev/deterministic-zip.py"), cwd, destination], { stdio: "inherit" }); }
