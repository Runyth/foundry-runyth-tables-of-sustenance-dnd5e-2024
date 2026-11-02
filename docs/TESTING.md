# runyth-tables-of-sustenance-dnd5e-2024-1.0.1

## Testing

Release qualification:

```text
npm run check
npm run validate
npm test
npm run build
npm run package
```

Automated tests cover manifest contracts, all-335 coverage, intent coverage, Item materialisation, servings, Active Effect mappings, permanent HP representation, contextual roll priming, the dnd5e 5.3.x `(config, dialog, message)` roll contract, guarded Actor resolution, a Midi-QOL-shaped workflow fallback, save hook naming, rest-result Hit Die deltas, adapter registration and runtime v13/deprecation scans.

Live Foundry execution is not claimed in this build environment; use the manual matrix for hosted acceptance.
