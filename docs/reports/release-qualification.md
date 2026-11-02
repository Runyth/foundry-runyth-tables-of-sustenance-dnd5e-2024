# runyth-tables-of-sustenance-dnd5e-2024-1.0.1

## Release Qualification

### Result

Qualified for release by static validation, automated tests, deterministic packaging, archive safety checks, and source reconstruction. A live licensed Foundry client was not available, so hosted runtime acceptance is deliberately not claimed.

### Automated qualification

- Runtime JavaScript syntax: 5 module files passed.
- Core-food coverage: all 335 canonical foods remain materialised for D&D 5e inventory use.
- Mechanically active foods: all 155 remain covered through the supported core intent contract.
- Built-in neutral intent kinds: 11/11 have D&D implementations.
- Unsupported packaged intents: 0.
- Automated tests: 20 passed, 0 failed before packaging qualification.
- Contextual skill/save handling follows the dnd5e 5.3.x `(config, dialog, message)` pre-roll contract.
- Actor flag access is capability-guarded; non-Actor roll configuration objects cannot trigger `getFlag` TypeErrors.
- Native `config.subject` Actor resolution and a narrow Midi-QOL-shaped `config.workflow.actor` fallback are covered by regression tests.
- D&D Short Rest recovery continues to use the dnd5e 5.3 `RestResult` Hit Die delta contract.

### Foundry v13/API audit

- Manifest uses only v13 `BaseModule` fields; unknown-key validation remains part of the build.
- D&D support is declared through `relationships.systems`; the invalid/unknown top-level module `system` key remains absent.
- Core >=1.1.0 is declared through `relationships.requires`.
- No deprecated global FilePicker, FormApplication/ApplicationV1, private render APIs, `data.data`, `game.system.data`, `manifestPlusVersion`, or obsolete `diceSpent` rest-field use was found.
- The obsolete `dnd5e.preRollAbilitySave` hook is absent; contextual saves use `dnd5e.preRollSavingThrow`.
- Hook-launched async work remains rejection-safe.
- The integration registers no generic sheet, HUD, Chat-render, Scene-Control, canvas, or global DOM hook.

### Hosted acceptance boundary

Run `docs/manual-tests/MANUAL-TEST-MATRIX.md` in Foundry VTT 13.351 with dnd5e 5.3.3, core >=1.1.0 and Midi-QOL where relevant before campaign deployment when live-client qualification is required.
