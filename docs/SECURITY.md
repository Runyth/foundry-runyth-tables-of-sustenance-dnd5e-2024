# runyth-tables-of-sustenance-dnd5e-2024-1.0.1

## Security and Data Safety

- The integration accepts canonical food definitions from the core and materialises only validated, stable-ID content.
- It does not own catalogue permissions, remote-serving authorization, Import/Export provenance, or player inventory authorization; those remain enforced by the core.
- D&D hooks operate only on actors/effects carrying the core module's namespaced food-effect records.
- No generic sheet, HUD, Chat, canvas, or global DOM interception is registered.
- Async hook work is rejection-safe so an optional food mechanic cannot interrupt unrelated Foundry or dnd5e workflows.
- All persistent integration state remains namespaced under the core/integration module flags and stable effect identifiers.
