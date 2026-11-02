# runyth-tables-of-sustenance-dnd5e-2024-1.0.1

## Compatibility Report

Static target: Foundry 13.351, dnd5e 5.3.3, core >=1.1.0.

The v1.0.1 audit rechecked manifest relationships, D&D 5.3.x roll-process hook signatures, RestResult Hit Die delta handling, Item consumable schema fields and Active Effect data paths. `dnd5e.preRollSkill` and `dnd5e.preRollSavingThrow` are handled using `(config, dialog, message)`, with the Actor resolved from `config.subject`. A narrow `config.workflow.actor` fallback supports wrapper-managed roll contexts such as Midi-QOL without assuming arbitrary hook arguments are Actors.

No deprecated global Foundry ApplicationV1/FilePicker usage or core-private API access is present in companion runtime code. The obsolete `dnd5e.preRollAbilitySave` hook name is absent.
