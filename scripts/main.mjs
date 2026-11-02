// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import { adapter } from "./adapter.mjs";
import { exposeApi } from "./api.mjs";
import { CORE_ID, MODULE_ID } from "./constants.mjs";
import { applyPrimedBonus } from "./roll-bonus.mjs";

let registeredCoreApi = null;

Hooks.once("init", () => {
  exposeApi();
  console.info(`${MODULE_ID} | Initialised.`);
});

Hooks.on(`${CORE_ID}.apiReady`, coreApi => {
  void registerWithCore(coreApi).catch(error => reportAsyncError("core registration", error));
});
Hooks.once("ready", async () => {
  if (game.system.id !== "dnd5e") {
    ui.notifications.error(game.i18n.localize(`${MODULE_ID}.Errors.WrongSystem`));
    return;
  }
  const coreApi = game.modules.get(CORE_ID)?.api ?? game[CORE_ID];
  if (!coreApi) {
    ui.notifications.error(game.i18n.localize(`${MODULE_ID}.Errors.CoreMissing`));
    return;
  }
  await registerWithCore(coreApi).catch(error => reportAsyncError("ready registration", error));
});

Hooks.on("dnd5e.preRollSavingThrow", (config, dialog, message) => {
  void applyPrimedBonus({ config, dialog, message, expectedType: "save" })
    .catch(error => reportAsyncError("saving-throw bonus", error));
});
Hooks.on("dnd5e.preRollSkill", (config, dialog, message) => {
  void applyPrimedBonus({ config, dialog, message, expectedType: "skill", skillId: config?.skill ?? null })
    .catch(error => reportAsyncError("skill bonus", error));
});
Hooks.on("dnd5e.restCompleted", (actor, result, config) => {
  void handleRestCompleted(actor, result, config).catch(error => reportAsyncError("rest benefit", error));
});

export async function registerWithCore(coreApi) {
  if (!coreApi || registeredCoreApi === coreApi) return adapter;
  if (game.system.id !== "dnd5e") return null;
  const current = coreApi.getSystemAdapter?.("dnd5e");
  if (current?.id === adapter.id && current?.moduleId === MODULE_ID) {
    registeredCoreApi = coreApi;
    return current;
  }
  coreApi.registerSystemAdapter("dnd5e", adapter);
  registeredCoreApi = coreApi;
  console.info(`${MODULE_ID} | Registered D&D 5e 2024 system adapter with ${CORE_ID}.`);
  return adapter;
}

export async function handleRestCompleted(actor, result = {}, config = {}) {
  if (!actor) return;
  const core = game.modules.get(CORE_ID)?.api ?? game[CORE_ID];
  const benefits = core?.inspectPermanentBenefits?.(actor) ?? {};
  const benefit = Object.values(benefits).find(record => hasRestRecovery(record));
  if (!benefit) return;
  const isShort = result.type === "short" || config.type === "short" || result.longRest === false;
  const spentHitDice = getSpentHitDice(result);
  if (!isShort || spentHitDice <= 0) return;
  const intent = restIntent(benefit);
  const hp = actor.system?.attributes?.hp;
  if (!hp || Number(hp.value) >= Number(hp.max)) return;
  const amount = Number(intent?.amount ?? benefit.custom?.amount ?? 1);
  await actor.update({ "system.attributes.hp.value": Math.min(Number(hp.max), Number(hp.value) + amount) });
  ui.notifications.info(game.i18n.format(`${MODULE_ID}.Benefits.RestHealingApplied`, { actor: actor.name, amount }));
}

export function getSpentHitDice(result = {}) {
  const delta = Number(result.dhd ?? result.deltas?.hitDice ?? 0);
  return Math.max(0, -delta);
}

function reportAsyncError(context, error) {
  console.error(`${MODULE_ID} | ${context} failed.`, error);
  Hooks.onError?.(`${MODULE_ID}.${context}`, error, { log: "error", notify: "error" });
}

function hasRestRecovery(benefit) {
  return Boolean(restIntent(benefit) || benefit?.custom?.type === "restHealing");
}

function restIntent(benefit) {
  return benefit?.effectIntents?.find(intent => intent.kind === "rest-recovery-bonus")
    ?? benefit?.adapterState?.restRecovery?.[0]
    ?? null;
}
