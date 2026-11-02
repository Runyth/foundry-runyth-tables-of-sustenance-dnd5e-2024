# runyth-tables-of-sustenance-dnd5e-2024-1.0.1

## Architecture

The companion registers adapter `dnd5e-2024` against core API 1.2.0. The core remains authoritative for lore, IDs, metadata, tiers, recipes and mechanical intent. The adapter produces D&D `consumable` Items and owns D&D Active Effects and D&D roll/rest hooks.

### Intent mappings

| Neutral intent | D&D implementation |
|---|---|
| `check-bonus` | skill check bonus field |
| `resistance-test-bonus` | ability save bonus field |
| `concentration-test-bonus` | concentration save bonus |
| `movement-speed-bonus` | movement bonus/swim field |
| `ignore-difficult-terrain` | ignored difficult terrain set |
| `movement-speed-match` | swim speed upgraded to walking speed formula |
| `damage-resistance` | damage resistance set |
| `maximum-vitality-bonus` | persistent no-duration effect on shared HP `tempmax` field |
| `contextual-resistance-test-bonus` | explicit prime-next-save workflow |
| `contextual-check-bonus` | explicit prime-next-skill workflow |
| `rest-recovery-bonus` | `dnd5e.restCompleted` Short Rest handler |

The `tempmax` mapping is intentionally chosen for shared Actor-schema compatibility; permanence comes from the no-duration Tier S Active Effect plus the core's permanent-benefit record.

### D&D hooks

Only the companion owns:
- `dnd5e.preRollSavingThrow`
- `dnd5e.preRollSkill`
- `dnd5e.restCompleted`

Core has none of these hooks.

### D&D 5.3.x roll-process contract

The contextual roll handlers consume the system's roll-process hook contract: `(config, dialog, message)`. The authoritative Actor is `config.subject`; `config.workflow.actor` is accepted only as a narrow compatibility fallback for wrappers such as Midi-QOL. Roll bonuses are inserted into `config.rolls[*].parts` before asynchronous primed-flag cleanup begins.
