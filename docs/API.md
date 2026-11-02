# runyth-tables-of-sustenance-dnd5e-2024-1.0.1

## API — v1.0.0

Access via `game.modules.get("runyth-tables-of-sustenance-dnd5e-2024").api`.

- `whenReady()`
- `getCoreApi()`
- `getStatus()`
- `materializeFood(food, options)`
- `validateCoverage()`
- `supportedIntentKinds()`
- `registerIntentHandler(kind, handler)`
- `unregisterIntentHandler(kind)`
- `adapter`

Custom intent handlers extend the D&D adapter only. Canonical content providers should register neutral intent data with the core rather than importing this companion.
