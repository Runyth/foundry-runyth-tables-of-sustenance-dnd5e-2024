import { CORE_FLAG_SCOPE, CORE_ID, FLAG_SCOPE, MODULE_ID, MODULE_VERSION } from "./constants.mjs";

const SKILLS = Object.freeze({
  survival: "sur",
  medicine: "med",
  perception: "prc",
  athletics: "ath",
  insight: "ins",
  nature: "nat",
  persuasion: "per",
  investigation: "inv",
  history: "his"
});
const ABILITIES = Object.freeze({ constitution: "con", dexterity: "dex", wisdom: "wis" });
const SUPPORTED_INTENTS = Object.freeze(new Set([
  "check-bonus",
  "resistance-test-bonus",
  "concentration-test-bonus",
  "movement-speed-bonus",
  "ignore-difficult-terrain",
  "movement-speed-match",
  "damage-resistance",
  "maximum-vitality-bonus",
  "contextual-resistance-test-bonus",
  "contextual-check-bonus",
  "rest-recovery-bonus"
]));
const customIntentHandlers = new Map();

export function registerIntentHandler(kind, handler) {
  const id = String(kind ?? "").trim();
  if (!id || typeof handler !== "function") throw new TypeError("D&D intent handler requires a stable kind and function.");
  customIntentHandlers.set(id, handler);
  return id;
}

export function unregisterIntentHandler(kind) { return customIntentHandlers.delete(kind); }
export function supportedIntentKinds() { return [...SUPPORTED_INTENTS, ...customIntentHandlers.keys()].sort(); }

export const adapter = Object.freeze({
  id: "dnd5e-2024",
  systemId: "dnd5e",
  moduleId: MODULE_ID,
  version: MODULE_VERSION,
  apiVersion: "1.0.0",
  capabilities: Object.freeze({
    materializeFoods: true,
    servings: true,
    activeEffects: true,
    cooldownCompatible: true,
    permanentBenefits: true,
    contextualRollBonuses: true,
    restRecovery: true,
    syntheticActors: true
  }),
  materializeFood,
  remainingServings,
  reduceServings,
  applyFoodEffect,
  removeFoodEffect,
  cleanupFoodEffects,
  describePermanentBenefit,
  primePermanentBenefit,
  unprimePermanentBenefit,
  getPrimedPermanentBenefit,
  diagnostics,
  registerIntentHandler,
  unregisterIntentHandler
});

async function materializeFood(definition, _options = {}) {
  const coreFlags = getCoreFlags(definition);
  if (coreFlags.kind !== "food" || !coreFlags.sourceId) throw new TypeError("Cannot materialize a source that is not a Tables of Sustenance food definition.");
  const meta = coreFlags.meta ?? {};
  const servings = Math.max(1, Number(meta.servings ?? 1));
  const price = meta.purchasePrice ?? { value: 0, denomination: "cp" };
  const identified = meta.identificationStatus !== "unidentified";
  return {
    _id: definition._id,
    name: definition.name,
    type: "consumable",
    img: definition.img,
    system: {
      description: { value: String(definition.description ?? ""), chat: "" },
      source: { custom: "Runyth Tables of Sustenance", book: "", page: "", license: "Original module content", rules: "2024" },
      quantity: servings,
      weight: { value: Number(meta.weight ?? 0), units: "lb" },
      price: { value: Number(price.value ?? 0), denomination: String(price.denomination ?? "cp") },
      attunement: "",
      equipped: false,
      rarity: "",
      identified,
      uses: { max: String(servings), recovery: [], autoDestroy: false, spent: 0 },
      damage: { base: { number: null, denomination: null, types: [], custom: { enabled: false, formula: "" }, scaling: { number: 1 } }, replace: false },
      type: { value: "food", subtype: "" },
      unidentified: { description: String(definition.unidentifiedDescription ?? "<p>An unidentified food preparation.</p>") },
      container: null,
      properties: [],
      magicalBonus: null,
      activities: {},
      identifier: stableIdentifier(coreFlags.sourceId)
    },
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS?.NONE ?? 0 },
    flags: {
      ...(foundry.utils.deepClone(definition.flags ?? {})),
      [FLAG_SCOPE]: {
        materialized: true,
        adapterId: "dnd5e-2024",
        adapterVersion: MODULE_VERSION,
        sourceId: coreFlags.sourceId
      }
    }
  };
}

function remainingServings(food) {
  const max = Number(foundry.utils.getProperty(food, "system.uses.max") ?? 0);
  const spent = Number(foundry.utils.getProperty(food, "system.uses.spent") ?? 0);
  if (max > 0) return Math.max(0, max - spent);
  const quantity = Number(foundry.utils.getProperty(food, "system.quantity") ?? getCoreFlags(food).meta?.servings ?? 1);
  return Math.max(0, quantity);
}

async function reduceServings(food, amount = 1, { deleteEmpty = false } = {}) {
  const count = Math.max(0, Number(amount ?? 0));
  const max = Number(foundry.utils.getProperty(food, "system.uses.max") ?? 0);
  const spent = Number(foundry.utils.getProperty(food, "system.uses.spent") ?? 0);
  let remaining;
  if (max > 0) {
    const newSpent = Math.min(max, spent + count);
    remaining = max - newSpent;
    await food.update({ "system.uses.spent": newSpent });
  } else {
    const quantity = Number(foundry.utils.getProperty(food, "system.quantity") ?? 1);
    remaining = Math.max(0, quantity - count);
    await food.update({ "system.quantity": remaining });
  }
  if (remaining === 0 && deleteEmpty && food.parent?.documentName === "Actor") await food.delete();
  return { remaining, changed: count > 0 };
}

async function applyFoodEffect({ actor, food, mechanics, permanent = false }) {
  const changes = [];
  const contextual = [];
  const restRecovery = [];
  for (const intent of mechanics.effectIntents ?? []) {
    const custom = customIntentHandlers.get(intent.kind);
    if (custom) {
      const result = await custom({ actor, food, mechanics, intent, permanent });
      if (result?.changes) changes.push(...result.changes);
      if (result?.contextual) contextual.push(...asArray(result.contextual));
      if (result?.restRecovery) restRecovery.push(...asArray(result.restRecovery));
      continue;
    }
    mapIntent(intent, { changes, contextual, restRecovery });
  }

  const activeEffectIds = [];
  if (changes.length) {
    const duration = permanent ? {} : { seconds: Number(mechanics.durationSeconds ?? 0), startTime: Number(game.time?.worldTime ?? 0) };
    const [effect] = await actor.createEmbeddedDocuments("ActiveEffect", [{
      name: food.name,
      img: food.img,
      origin: food.uuid ?? null,
      transfer: false,
      disabled: false,
      duration,
      changes,
      description: `<p>${mechanics.summary ?? ""}</p>`,
      flags: {
        [CORE_ID]: {
          effectId: mechanics.effectId,
          sourceId: getCoreFlags(food).sourceId,
          tier: mechanics.tier,
          stackingGroup: mechanics.stackingGroup,
          permanent
        },
        [FLAG_SCOPE]: { adapterId: "dnd5e-2024", adapterVersion: MODULE_VERSION }
      }
    }]);
    if (effect?.id) activeEffectIds.push(effect.id);
  }
  const applied = Boolean(changes.length || contextual.length || restRecovery.length);
  return { applied, state: { activeEffectIds, contextual, restRecovery } };
}

async function removeFoodEffect({ actor, record }) {
  const ids = new Set(record?.adapterState?.activeEffectIds ?? []);
  const effectId = record?.effectId ?? record?.adapterState?.effectId;
  for (const effect of actor.effects ?? []) {
    const coreEffectId = effect.getFlag?.(CORE_ID, "effectId") ?? foundry.utils.getProperty(effect, `flags.${CORE_ID}.effectId`);
    if (effectId && coreEffectId === effectId) ids.add(effect.id);
    if (record?.effectUuid && effect.uuid === record.effectUuid) ids.add(effect.id);
  }
  if (ids.size) await actor.deleteEmbeddedDocuments("ActiveEffect", [...ids]);
  const primed = await getPrimedPermanentBenefit({ actor });
  if (primed?.effectId && primed.effectId === effectId) await unprimePermanentBenefit({ actor });
  return { removed: ids.size > 0, activeEffectIds: [...ids] };
}

async function cleanupFoodEffects() {
  return { removed: 0 };
}

async function describePermanentBenefit({ benefit }) {
  const intents = normalizeBenefitIntents(benefit);
  const contextual = intents.find(intent => ["contextual-resistance-test-bonus", "contextual-check-bonus"].includes(intent.kind));
  if (!contextual) return { contextual: false, bonus: 0, context: "" };
  return { contextual: true, bonus: Number(contextual.amount ?? 1), context: describeIntent(contextual) };
}

async function primePermanentBenefit({ actor, benefit }) {
  const intent = normalizeBenefitIntents(benefit).find(entry => ["contextual-resistance-test-bonus", "contextual-check-bonus"].includes(entry.kind));
  if (!intent) throw new Error(game.i18n.localize(`${MODULE_ID}.Errors.NotContextual`));
  const record = {
    effectId: benefit.effectId ?? null,
    name: benefit.name,
    type: intent.kind === "contextual-check-bonus" ? "skill" : "save",
    skill: intent.kind === "contextual-check-bonus" ? SKILLS[intent.domain] ?? intent.domain : null,
    bonus: Number(intent.amount ?? 1),
    context: describeIntent(intent),
    primedBy: game.user.id,
    primedAt: new Date().toISOString()
  };
  await actor.setFlag(FLAG_SCOPE, "primedBonus", record);
  return record;
}

async function unprimePermanentBenefit({ actor }) {
  await actor.unsetFlag(FLAG_SCOPE, "primedBonus");
  return true;
}

async function getPrimedPermanentBenefit({ actor }) {
  return actor.getFlag(FLAG_SCOPE, "primedBonus") ?? null;
}

async function diagnostics() {
  const core = game.modules.get(CORE_ID)?.api ?? game[CORE_ID];
  const foods = core ? await core.queryFoods({ localized: false }) : [];
  const unsupported = [];
  for (const food of foods) {
    for (const intent of getCoreFlags(food).mechanics?.effectIntents ?? []) {
      if (!SUPPORTED_INTENTS.has(intent.kind) && !customIntentHandlers.has(intent.kind)) unsupported.push({ sourceId: getCoreFlags(food).sourceId, kind: intent.kind });
    }
  }
  const findings = [];
  if (foods.length !== 335) findings.push({ severity: "warning", code: "DND5E_CORE_COVERAGE", message: `D&D adapter sees ${foods.length} foods; expected 335 packaged core foods.` });
  if (unsupported.length) findings.push({ severity: "error", code: "DND5E_UNSUPPORTED_INTENT", message: `${unsupported.length} food effect intents have no D&D 5e handler.`, data: { unsupported } });
  return { systemId: game.system.id, systemVersion: game.system.version, foods: foods.length, supported: foods.length - new Set(unsupported.map(entry => entry.sourceId)).size, unsupported, findings };
}

function mapIntent(intent, output) {
  const add = mode("ADD", 2);
  const upgrade = mode("UPGRADE", 4);
  const amount = String(Number(intent.amount ?? 0));
  switch (intent.kind) {
    case "check-bonus": {
      const skill = SKILLS[intent.domain];
      if (!skill) throw new Error(`Unsupported D&D skill domain: ${intent.domain}`);
      output.changes.push(change(`system.skills.${skill}.bonuses.check`, add, amount));
      break;
    }
    case "resistance-test-bonus": {
      const ability = ABILITIES[intent.domain];
      if (!ability) throw new Error(`Unsupported D&D ability domain: ${intent.domain}`);
      output.changes.push(change(`system.abilities.${ability}.bonuses.save`, add, amount));
      break;
    }
    case "concentration-test-bonus": output.changes.push(change("system.attributes.concentration.bonuses.save", add, amount)); break;
    case "movement-speed-bonus": output.changes.push(change(intent.scope === "swim" ? "system.attributes.movement.swim" : "system.attributes.movement.bonus", add, amount)); break;
    case "ignore-difficult-terrain": output.changes.push(change("system.attributes.movement.ignoredDifficultTerrain", add, String(intent.terrain))); break;
    case "movement-speed-match": output.changes.push(change("system.attributes.movement.swim", upgrade, "@attributes.movement.walk")); break;
    case "damage-resistance": output.changes.push(change("system.traits.dr.value", add, String(intent.damageType))); break;
    case "maximum-vitality-bonus": output.changes.push(change("system.attributes.hp.tempmax", add, amount)); break;
    case "contextual-resistance-test-bonus": output.contextual.push(intent); break;
    case "contextual-check-bonus": output.contextual.push(intent); break;
    case "rest-recovery-bonus": output.restRecovery.push(intent); break;
    default: throw new Error(`Unsupported D&D 5e food effect intent: ${intent.kind}`);
  }
}

function normalizeBenefitIntents(benefit) {
  if (Array.isArray(benefit?.effectIntents)) return benefit.effectIntents;
  const legacy = benefit?.custom;
  if (!legacy) return [];
  if (legacy.type === "narrowSave") return [{ kind: "contextual-resistance-test-bonus", amount: Number(legacy.bonus ?? 1), context: { creature: legacy.creature, effect: legacy.effect, hazard: legacy.hazard } }];
  if (legacy.type === "narrowSkill") return [{ kind: "contextual-check-bonus", domain: Object.entries(SKILLS).find(([, id]) => id === legacy.skill)?.[0] ?? legacy.skill, amount: Number(legacy.bonus ?? 1), context: legacy.context }];
  if (legacy.type === "restHealing") return [{ kind: "rest-recovery-bonus", rest: "short", condition: "recovery-resource-spent", amount: Number(legacy.amount ?? 1) }];
  return [];
}

function describeIntent(intent) {
  if (intent.kind === "contextual-check-bonus") return [intent.domain, intent.context].filter(Boolean).join(" — ");
  const context = intent.context ?? {};
  return [context.creature, context.effect, context.hazard].filter(Boolean).join(" — ");
}
function getCoreFlags(source) { return foundry.utils.getProperty(source, `flags.${CORE_FLAG_SCOPE}`) ?? {}; }
function stableIdentifier(sourceId) { return String(sourceId).split(".").slice(-1)[0] || foundry.utils.slugify(sourceId); }
function change(key, modeValue, value) { return { key, mode: modeValue, value, priority: 20 }; }
function mode(name, fallback) { return globalThis.CONST?.ACTIVE_EFFECT_MODES?.[name] ?? fallback; }
function asArray(value) { return Array.isArray(value) ? value : [value]; }
