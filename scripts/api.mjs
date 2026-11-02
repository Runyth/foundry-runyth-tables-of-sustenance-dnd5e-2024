import { adapter, registerIntentHandler, supportedIntentKinds, unregisterIntentHandler } from "./adapter.mjs";
import { API_VERSION, CORE_ID, MODULE_ID } from "./constants.mjs";

export const api = Object.freeze({
  version: API_VERSION,
  adapter,
  whenReady: async () => {
    if (!game.ready) await new Promise(resolve => Hooks.once("ready", resolve));
    return api;
  },
  getCoreApi: () => game.modules.get(CORE_ID)?.api ?? game[CORE_ID] ?? null,
  getStatus: () => ({
    active: game.system.id === "dnd5e",
    system: { id: game.system.id, version: game.system.version },
    coreActive: Boolean(game.modules.get(CORE_ID)?.active),
    registered: (game.modules.get(CORE_ID)?.api ?? game[CORE_ID])?.getSystemAdapter?.("dnd5e")?.id === adapter.id
  }),
  materializeFood: (food, options) => adapter.materializeFood(food, options),
  validateCoverage: () => adapter.diagnostics(),
  registerIntentHandler,
  unregisterIntentHandler,
  supportedIntentKinds
});

export function exposeApi() {
  game[MODULE_ID] = api;
  const module = game.modules.get(MODULE_ID);
  if (module) module.api = api;
}
