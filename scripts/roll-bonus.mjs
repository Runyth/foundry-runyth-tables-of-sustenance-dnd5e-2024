import { FLAG_SCOPE, MODULE_ID } from "./constants.mjs";

const appliedProcesses = new WeakSet();

/**
 * Resolve the D&D Actor carried by the 5.3.x roll-process configuration.
 * Fallback candidates are intentionally narrow to remain compatible with roll
 * wrappers such as Midi-QOL without guessing arbitrary object shapes.
 */
export function resolveRollActor(config = {}, dialog = {}, message = {}) {
  const candidates = [
    config?.subject,
    config?.actor,
    config?.token?.actor,
    config?.workflow?.actor,
    dialog?.subject,
    dialog?.actor,
    message?.subject,
    message?.actor
  ];
  for (const candidate of candidates) {
    if (hasFlagApi(candidate)) return candidate;
  }

  const actorId = message?.data?.speaker?.actor ?? message?.speaker?.actor ?? null;
  const actor = actorId ? globalThis.game?.actors?.get?.(actorId) : null;
  return hasFlagApi(actor) ? actor : null;
}

/**
 * Apply and consume one primed contextual food bonus during a D&D 5.3.x roll.
 * The roll configuration is modified synchronously before the first await so
 * Foundry can continue building the roll while flag cleanup completes.
 */
export async function applyPrimedBonus({ config, dialog, message, expectedType, skillId = null } = {}) {
  if (!config || typeof config !== "object") return { applied: false, reason: "invalid-config" };
  if (appliedProcesses.has(config)) return { applied: false, reason: "already-applied" };

  const actor = resolveRollActor(config, dialog, message);
  if (!actor) return { applied: false, reason: "actor-unavailable" };

  const primed = actor.getFlag(FLAG_SCOPE, "primedBonus");
  if (!primed || primed.type !== expectedType) return { applied: false, reason: "no-matching-bonus" };
  if (expectedType === "skill" && primed.skill && skillId && primed.skill !== skillId) {
    return { applied: false, reason: "skill-mismatch" };
  }

  const bonus = Number(primed.bonus ?? 1);
  if (!Number.isFinite(bonus)) return { applied: false, reason: "invalid-bonus" };
  const fallbackName = globalThis.game?.i18n?.localize?.(`${MODULE_ID}.Benefits.FallbackName`) ?? "Food benefit";
  const displayName = primed.name ?? fallbackName;
  const label = sanitizeFormulaLabel(displayName, fallbackName);
  const formula = `${bonus}[${label}]`;
  const modifiedRolls = appendFormula(config, formula);
  if (!modifiedRolls) return { applied: false, reason: "roll-config-unavailable" };

  appliedProcesses.add(config);

  await actor.unsetFlag(FLAG_SCOPE, "primedBonus");
  globalThis.ui?.notifications?.info?.(globalThis.game?.i18n?.format?.(`${MODULE_ID}.Benefits.Applied`, {
    bonus,
    name: displayName
  }) ?? `${label}: +${bonus}`);

  return { applied: true, actor, bonus, formula, modifiedRolls };
}

export function appendFormula(config, formula) {
  if (!config || typeof config !== "object" || typeof formula !== "string" || !formula) return 0;

  const rollConfigs = Array.isArray(config.rolls) ? config.rolls.filter(value => value && typeof value === "object") : [];
  if (rollConfigs.length) {
    let modified = 0;
    for (const rollConfig of rollConfigs) {
      rollConfig.parts ??= [];
      if (!Array.isArray(rollConfig.parts)) continue;
      if (!rollConfig.parts.includes(formula)) rollConfig.parts.push(formula);
      modified += 1;
    }
    return modified;
  }

  config.parts ??= [];
  if (!Array.isArray(config.parts)) return 0;
  if (!config.parts.includes(formula)) config.parts.push(formula);
  return 1;
}

function hasFlagApi(candidate) {
  return Boolean(candidate)
    && typeof candidate.getFlag === "function"
    && typeof candidate.unsetFlag === "function";
}

function sanitizeFormulaLabel(value, fallback) {
  return String(value).replace(/[\[\]\r\n]/g, " ").replace(/\s+/g, " ").trim() || fallback;
}
