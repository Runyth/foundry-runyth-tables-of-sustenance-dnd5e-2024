# runyth-tables-of-sustenance-dnd5e-2024-1.0.1

## Compatibility

| Component | Target |
|---|---|
| Foundry VTT | 13.347–13.351 |
| D&D Fifth Edition | 5.3.0–5.3.3 |
| Core module | >=1.1.0 |
| Companion API | 1.0.0 |

The manifest uses `relationships.systems` for the dnd5e compatibility declaration and `relationships.requires` for the core module dependency. It intentionally contains no unsupported top-level `system` key.

The adapter was audited against the 5.3.x Item data model, Active Effect guide and rest/roll hooks. In dnd5e 5.3.x, pre-roll hooks receive `(config, dialog, message)` and expose the rolling Actor as `config.subject`; this companion follows that contract for both `preRollSkill` and `preRollSavingThrow`. It does not use deprecated `data.data`, global FilePicker/ApplicationV1 classes, or core-private APIs.

References:
- https://github.com/foundryvtt/dnd5e/releases
- https://github.com/foundryvtt/dnd5e/wiki/Active-Effect-Guide
- https://foundryvtt.com/releases/13.351
- https://foundryvtt.com/article/module-development/
