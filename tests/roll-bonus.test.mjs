// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Daniel Braniewski. See the LICENSE file for rights and obligations.
import test from "node:test";
import assert from "node:assert/strict";

const notifications = [];
globalThis.game = {
  actors: { get: () => null },
  i18n: { format: (key, data) => `${key}:${data.bonus}:${data.name}` }
};
globalThis.ui = { notifications: { info: message => notifications.push(message) } };

const { applyPrimedBonus, appendFormula, resolveRollActor } = await import("../scripts/roll-bonus.mjs");

function makeActor(primed) {
  let flag = primed;
  return {
    getFlag() {
      return flag;
    },
    async unsetFlag() {
      flag = null;
    },
    currentFlag() {
      return flag;
    }
  };
}

test("resolves the D&D 5.3 actor from config.subject", () => {
  const actor = makeActor(null);
  assert.equal(resolveRollActor({ subject: actor }), actor);
});

test("supports a narrow Midi-QOL workflow actor fallback", () => {
  const actor = makeActor(null);
  assert.equal(resolveRollActor({ workflow: { actor } }), actor);
});

test("ignores non-Actor roll context instead of calling getFlag on it", async () => {
  const config = { subject: { getFlag: "not-a-function" }, rolls: [{ parts: [] }] };
  const result = await applyPrimedBonus({ config, expectedType: "skill", skillId: "sur" });
  assert.deepEqual(result, { applied: false, reason: "actor-unavailable" });
  assert.deepEqual(config.rolls[0].parts, []);
});

test("applies one primed skill bonus through the D&D 5.3 process configuration", async () => {
  notifications.length = 0;
  const actor = makeActor({ type: "skill", skill: "sur", bonus: 1, name: "Trail Bread" });
  const config = { subject: actor, skill: "sur", rolls: [{ parts: [] }] };
  const result = await applyPrimedBonus({ config, expectedType: "skill", skillId: config.skill });
  assert.equal(result.applied, true);
  assert.deepEqual(config.rolls[0].parts, ["1[Trail Bread]"]);
  assert.equal(actor.currentFlag(), null);
  assert.equal(notifications.length, 1);
});

test("does not consume a skill bonus on a different skill", async () => {
  const actor = makeActor({ type: "skill", skill: "med", bonus: 1, name: "Herbal Broth" });
  const config = { subject: actor, skill: "sur", rolls: [{ parts: [] }] };
  const result = await applyPrimedBonus({ config, expectedType: "skill", skillId: config.skill });
  assert.equal(result.applied, false);
  assert.equal(result.reason, "skill-mismatch");
  assert.ok(actor.currentFlag());
  assert.deepEqual(config.rolls[0].parts, []);
});

test("applies a primed saving-throw bonus from config.subject", async () => {
  const actor = makeActor({ type: "save", bonus: 1, name: "Moon Pear" });
  const config = { subject: actor, ability: "wis", rolls: [{ parts: ["@mod"] }] };
  const result = await applyPrimedBonus({ config, expectedType: "save" });
  assert.equal(result.applied, true);
  assert.deepEqual(config.rolls[0].parts, ["@mod", "1[Moon Pear]"]);
  assert.equal(actor.currentFlag(), null);
});

test("adds the bonus to every configured roll without duplicate insertion", () => {
  const config = { rolls: [{ parts: [] }, { parts: ["2[Food]"] }] };
  assert.equal(appendFormula(config, "2[Food]"), 2);
  assert.deepEqual(config.rolls[0].parts, ["2[Food]"]);
  assert.deepEqual(config.rolls[1].parts, ["2[Food]"]);
});

test("guards the same roll process against duplicate primed application", async () => {
  const actor = makeActor({ type: "skill", skill: "sur", bonus: 1, name: "Trail Bread" });
  const config = { subject: actor, skill: "sur", rolls: [{ parts: [] }] };
  const first = await applyPrimedBonus({ config, expectedType: "skill", skillId: "sur" });
  const second = await applyPrimedBonus({ config, expectedType: "skill", skillId: "sur" });
  assert.equal(first.applied, true);
  assert.equal(second.applied, false);
  assert.equal(second.reason, "already-applied");
  assert.deepEqual(config.rolls[0].parts, ["1[Trail Bread]"]);
});
