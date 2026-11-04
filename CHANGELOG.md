# Changelog

## 1.0.3 — 2026-11-04

- The installable archive now ships every relative import the manifest entry needs, so the module's buttons and settings register on world load instead of silently failing.

## 1.0.2 — 2026-11-03

- AGENTS.md conformance release: the manifest author carries the standard organisational URL, and the README states the CC BY-SA 4.0 content licence for the materialised gameplay content. No runtime behaviour relationship or dependency change.

## 1.0.1 — 2026-08-12

- First publication as a Runyth module: `runyth-tables-of-sustenance-dnd5e-2024` / **Runyth Tables of Sustenance - D&D 5e 2024** with the publication standard in place — deterministic `-mod`, `-src`, and `-doc` archives with per-version checksums, byte-identical rebuild verification, standard quality and release pipelines, the full GNU AGPL-3.0-or-later licence with the standard source notice, the standard README licence chapter, and the manifest URL surfaces.

- Fixed repeated `skill bonus failed` errors during D&D 5e 5.3.x skill rolls.
- Corrected contextual roll hooks to the D&D 5.3.x process signature `(config, dialog, message)`; Actor resolution now uses `config.subject` rather than treating the first hook argument as an Actor.
- Corrected contextual saving-throw priming from obsolete `dnd5e.preRollAbilitySave` to the D&D 5.3.x `dnd5e.preRollSavingThrow` hook.
- Added guarded Actor capability detection before any `getFlag` or `unsetFlag` call, preventing non-Actor roll configuration objects from throwing.
- Added a narrow `config.workflow.actor` fallback for Midi-QOL-compatible roll wrappers while keeping native `config.subject` authoritative.
- Added idempotent per-process bonus insertion and support for all configured rolls without duplicate formula parts.
- Preserved primed bonuses when a skill does not match or when no usable roll configuration is available.
- Sanitised roll-formula flavour labels before insertion.
- Expanded automated regression coverage for native D&D 5.3.x and Midi-QOL-shaped roll contexts.
- Retained Foundry v13.347–13.351, dnd5e 5.3.0–5.3.3, core >=1.1.0 and companion API 1.0.0 compatibility.

## 1.0.0 — 2026-08-09

- New complementary D&D 5e 2024 module extracted from the former monolithic core.
- Materialises all 335 core foods as valid D&D consumable Items.
- Maps all 155 mechanically active core foods through 11 neutral intent kinds.
- Owns D&D Active Effects, servings, contextual roll hooks and Short Rest recovery.
- Preserves stable core source/effect IDs and legacy permanent-benefit migration support.
- Corrected Short Rest Hit Die handling to the dnd5e 5.3.x `RestResult` delta contract.
- Uses Foundry v13 `relationships.systems` / `relationships.requires` manifest fields and contains no duplicate core content catalogue.
- Removed the invalid top-level module `system` manifest key and added an unknown-manifest-key regression guard.
