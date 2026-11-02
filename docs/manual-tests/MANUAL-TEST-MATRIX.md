# runyth-tables-of-sustenance-dnd5e-2024-1.0.1

## Manual Test Matrix

Run on Foundry 13.351 + D&D 5e 5.3.3 + core 1.1.0.

1. Both modules initialise without errors/deprecations.
2. Core Diagnostics reports adapter `dnd5e-2024`.
3. Import one Tier 1, Tier 2, Tier 3, Tier 4 and Tier S food.
4. Verify Item description, quantity/uses, weight, price, identification and stable flags.
5. Consume and serve foods to world and synthetic-token actors.
6. Verify every temporary mapped effect expires as authored.
7. Verify Tier 4 cooldown and override.
8. Verify Tier S duplicate prevention and Benefit Manager removal.
9. Verify contextual skill priming affects only one qualifying native D&D skill roll and does not log `skill bonus failed`.
10. Repeat contextual skill priming through a Midi-QOL-managed skill-roll workflow and verify no hook error is logged.
11. Verify contextual saving-throw priming affects one qualifying save through `preRollSavingThrow`.
12. Spend Hit Dice on a Short Rest and verify Starfall Grain; verify no healing without Hit Dice or on Long Rest.
13. Update imported content with edit preservation enabled.
14. Disable companion and confirm core neutral browser/menu/diagnostics still operate.
