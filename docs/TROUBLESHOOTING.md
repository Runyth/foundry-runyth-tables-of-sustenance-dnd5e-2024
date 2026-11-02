# runyth-tables-of-sustenance-dnd5e-2024-1.0.1

## Troubleshooting

### Core says no system adapter
Confirm both modules are active and that the world system ID is `dnd5e`. Then reload and run Diagnostics.

### Starfall Grain does not heal after rest
It only applies to a Short Rest where the D&D rest result reports spent Hit Dice. The 5.3.x hook reports that as a negative hit-die delta (`result.dhd` / `result.deltas.hitDice`).

### Narrow Tier S bonus does not appear on every roll
This is deliberate. Contextual bonuses are primed for a qualifying next roll rather than widened into an always-on bonus.

### An unknown intent is reported
A complementary content module registered an intent not implemented by this adapter. Its D&D companion must call `registerIntentHandler` or update its content contract.

### `skill bonus failed` / `actor.getFlag is not a function`
Version 1.0.1 fixes this 1.0.0 defect. D&D 5.3.x passes a roll-process configuration object as the first `preRollSkill` argument, not an Actor. Update this companion to 1.0.1 or newer; no world-data migration is required.
