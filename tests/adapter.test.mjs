import test from "node:test";
import assert from "node:assert/strict";

globalThis.foundry = { utils: {
  getProperty(object, path) { return path.split(".").reduce((value, key) => value?.[key], object); },
  deepClone(value) { return structuredClone(value); },
  slugify(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
} };
globalThis.CONST = { ACTIVE_EFFECT_MODES: { ADD: 2, UPGRADE: 4 }, DOCUMENT_OWNERSHIP_LEVELS: { NONE: 0 } };
globalThis.game = { time: { worldTime: 1000 }, system: { id: "dnd5e", version: "5.3.3" }, i18n: { localize: key => key }, user: { id: "u1" } };

const { adapter, supportedIntentKinds } = await import("../scripts/adapter.mjs");
const coreFlags = {
  sourceId: "food.test.001",
  sourceVersion: "1.1.0",
  kind: "food",
  meta: { tier: "2", servings: 3, weight: 1.5, purchasePrice: { value: 4, denomination: "sp" }, identificationStatus: "identified" },
  mechanics: { tier: "2", effectId: "effect.test", summary: "+1", durationSeconds: 600, stackingGroup: "tier-2", effectIntents: [{ kind: "check-bonus", domain: "survival", amount: 1 }] }
};
const food = { _id: "abcdefghijklmnop", name: "Test Stew", img: "icons/test.webp", description: "<p>Test</p>", flags: { "runyth-tables-of-sustenance": coreFlags } };

test("materializes a neutral food into a D&D 5e consumable without duplicating canonical lore", async () => {
  const item = await adapter.materializeFood(food);
  assert.equal(item.type, "consumable");
  assert.equal(item.system.type.value, "food");
  assert.equal(item.system.uses.max, "3");
  assert.equal(item.system.weight.value, 1.5);
  assert.equal(item.system.price.denomination, "sp");
  assert.equal(item.system.description.value, "<p>Test</p>");
  assert.equal(item.flags["runyth-tables-of-sustenance"].sourceId, "food.test.001");
});

test("maps neutral effect intents to D&D 5e Active Effect changes", async () => {
  const created = [];
  const actor = {
    async createEmbeddedDocuments(type, sources) { assert.equal(type, "ActiveEffect"); created.push(...sources); return sources.map((source, i) => ({ ...source, id: `e${i}` })); }
  };
  const result = await adapter.applyFoodEffect({ actor, food, mechanics: coreFlags.mechanics, permanent: false });
  assert.equal(result.applied, true);
  assert.equal(created[0].changes[0].key, "system.skills.sur.bonuses.check");
  assert.equal(created[0].changes[0].value, "1");
});

test("uses hp.tempmax for permanent maximum-vitality bonuses", async () => {
  const created = [];
  const actor = { async createEmbeddedDocuments(_type, sources) { created.push(...sources); return [{ ...sources[0], id: "hp1" }]; } };
  await adapter.applyFoodEffect({ actor, food, mechanics: { ...coreFlags.mechanics, tier: "S", effectId: "legendary.hp", effectIntents: [{ kind: "maximum-vitality-bonus", amount: 2 }] }, permanent: true });
  assert.equal(created[0].changes[0].key, "system.attributes.hp.tempmax");
  assert.equal(created[0].changes[0].value, "2");
});

test("declares handlers for every built-in neutral intent kind", () => {
  for (const kind of ["check-bonus", "resistance-test-bonus", "concentration-test-bonus", "movement-speed-bonus", "ignore-difficult-terrain", "movement-speed-match", "damage-resistance", "maximum-vitality-bonus", "contextual-resistance-test-bonus", "contextual-check-bonus", "rest-recovery-bonus"]) assert.ok(supportedIntentKinds().includes(kind));
});
