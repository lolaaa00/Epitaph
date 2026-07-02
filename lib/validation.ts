import {
  MAX_NAME_CHARS,
  MAX_LIFE_PERIOD_CHARS,
  MAX_IDENTITY_LINE_CHARS,
  MAX_CLAIM_CHARS,
  MAX_SOURCE_REF_CHARS,
  MAX_DESCRIPTION_CHARS,
  MAX_MEMORY_CHARS,
  MAX_CONTEXT_CHARS,
  MAX_ID_CHARS,
  MAX_RELATIONSHIP_CHARS,
  MAX_CREDIBILITY_HINT_CHARS,
} from "./constants";

const INJECTION_MARKERS = [
  "ignore previous instructions",
  "ignore all previous instructions",
  "disregard previous instructions",
  "consensus must say",
  "consensus should say",
  "set impact_score",
  "set memory_confidence",
  "preservation_recommendation must be",
  "preservation_recommendation should be",
  "resolution must be",
  "resolution should be",
  "final_result",
  "the verdict is",
  "you must output",
  "system prompt",
  "as the validator, you",
];

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function ok(): ValidationResult {
  return { ok: true };
}

export function fail(error: string): ValidationResult {
  return { ok: false, error };
}

export function requireBounded(
  value: string,
  maxLen: number,
  fieldLabel: string
): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) return fail(`${fieldLabel} is required.`);
  if (trimmed.length > maxLen)
    return fail(`${fieldLabel} must be ${maxLen} characters or fewer.`);
  return ok();
}

export function optionalBounded(
  value: string,
  maxLen: number,
  fieldLabel: string
): ValidationResult {
  if (value.trim().length > maxLen)
    return fail(`${fieldLabel} must be ${maxLen} characters or fewer.`);
  return ok();
}

export function requireId(value: string, fieldLabel: string): ValidationResult {
  const trimmed = value.trim();
  if (trimmed.length === 0) return fail(`${fieldLabel} is required.`);
  if (trimmed.length > MAX_ID_CHARS)
    return fail(`${fieldLabel} must be ${MAX_ID_CHARS} characters or fewer.`);
  if (!/^[A-Za-z0-9_\-:.]+$/.test(trimmed))
    return fail(`${fieldLabel} may only contain letters, numbers, -, _, ., and :`);
  return ok();
}

export function detectInjection(...fields: string[]): ValidationResult {
  for (const f of fields) {
    const lowered = f.toLowerCase();
    for (const marker of INJECTION_MARKERS) {
      if (lowered.includes(marker)) {
        return fail(
          "This text reads like an instruction to the validator rather than a memory or claim. Evidence must describe what happened, not dictate the outcome."
        );
      }
    }
  }
  return ok();
}

export function firstFailure(...results: ValidationResult[]): ValidationResult {
  for (const r of results) {
    if (!r.ok) return r;
  }
  return ok();
}

export function validateCreateVault(input: {
  personName: string;
  lifePeriod: string;
  identityLine: string;
  initialClaim: string;
  submitterRelation: string;
  initialSourceRef: string;
  initialEvidenceDescription: string;
}): ValidationResult {
  return firstFailure(
    requireBounded(input.personName, MAX_NAME_CHARS, "Person name"),
    optionalBounded(input.lifePeriod, MAX_LIFE_PERIOD_CHARS, "Life period"),
    requireBounded(input.identityLine, MAX_IDENTITY_LINE_CHARS, "Identity line"),
    requireBounded(input.initialClaim, MAX_CLAIM_CHARS, "Initial legacy claim"),
    requireBounded(input.submitterRelation, MAX_RELATIONSHIP_CHARS, "Relationship"),
    requireBounded(input.initialSourceRef, MAX_SOURCE_REF_CHARS, "Source reference"),
    requireBounded(
      input.initialEvidenceDescription,
      MAX_DESCRIPTION_CHARS,
      "Evidence description"
    ),
    detectInjection(
      input.personName,
      input.identityLine,
      input.initialClaim,
      input.submitterRelation,
      input.initialEvidenceDescription
    )
  );
}

export function validateEvidence(input: {
  sourceRef: string;
  claimSupported: string;
  description: string;
  credibilityHint: string;
}): ValidationResult {
  return firstFailure(
    requireBounded(input.sourceRef, MAX_SOURCE_REF_CHARS, "Source reference"),
    requireBounded(input.claimSupported, MAX_CLAIM_CHARS, "Claim supported"),
    requireBounded(input.description, MAX_DESCRIPTION_CHARS, "Description"),
    optionalBounded(input.credibilityHint, MAX_CREDIBILITY_HINT_CHARS, "Credibility hint"),
    detectInjection(input.claimSupported, input.description, input.credibilityHint)
  );
}

export function validateMemory(input: {
  relationship: string;
  memoryText: string;
  context: string;
}): ValidationResult {
  return firstFailure(
    requireBounded(input.relationship, MAX_RELATIONSHIP_CHARS, "Relationship"),
    requireBounded(input.memoryText, MAX_MEMORY_CHARS, "Memory text"),
    optionalBounded(input.context, MAX_CONTEXT_CHARS, "Context"),
    detectInjection(input.relationship, input.memoryText, input.context)
  );
}

export function validateFracture(input: {
  targetId: string;
  claim: string;
  evidenceRef: string;
}): ValidationResult {
  return firstFailure(
    requireId(input.targetId, "Target id"),
    requireBounded(input.claim, MAX_CLAIM_CHARS, "Claim"),
    optionalBounded(input.evidenceRef, MAX_SOURCE_REF_CHARS, "Evidence reference"),
    detectInjection(input.claim, input.evidenceRef)
  );
}

export function slugifyId(value: string, prefix: string): string {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const stamp = Date.now().toString(36);
  return `${prefix}-${base.slice(0, 40) || "x"}-${stamp}`;
}
