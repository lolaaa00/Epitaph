export const GENLAYER_CHAIN_ID = 61999;
export const GENLAYER_RPC_URL = "https://studio.genlayer.com/api";
export const GENLAYER_EXPLORER_BASE = "https://explorer-studio.genlayer.com";

export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_EPITAPH_CONTRACT_ADDRESS ?? "";

export function explorerTxUrl(hash: string): string {
  return `${GENLAYER_EXPLORER_BASE}/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${GENLAYER_EXPLORER_BASE}/address/${address}`;
}

// ── Bounded string limits (must mirror contracts/EpitaphLegacyProtocol.py) ──
export const MAX_NAME_CHARS = 96;
export const MAX_LIFE_PERIOD_CHARS = 64;
export const MAX_IDENTITY_LINE_CHARS = 160;
export const MAX_CLAIM_CHARS = 700;
export const MAX_SOURCE_REF_CHARS = 500;
export const MAX_DESCRIPTION_CHARS = 900;
export const MAX_MEMORY_CHARS = 1200;
export const MAX_CONTEXT_CHARS = 500;
export const MAX_REASONING_CHARS = 1000;
export const MAX_SUMMARY_CHARS = 1200;
export const MAX_PROFILE_CHARS = 1200;
export const MAX_ASSESSMENT_CHARS = 1000;
export const MAX_ID_CHARS = 80;
export const MAX_RELATIONSHIP_CHARS = 120;
export const MAX_CREDIBILITY_HINT_CHARS = 200;

export const VAULT_STATES = [
  "UNSEALED",
  "COLLECTING",
  "AWAITING_CONSENSUS",
  "INSCRIBED",
  "DISPUTED",
  "RECONCILED",
  "SEALED",
  "UNDETERMINED",
] as const;
export type VaultState = (typeof VAULT_STATES)[number];

export const EVIDENCE_TYPES = [
  "WRITING",
  "ACHIEVEMENT",
  "TESTIMONIAL_SUPPORT",
  "PUBLIC_RECORD",
  "MEDIA_REFERENCE",
  "AWARD",
  "CONTROVERSY",
  "CORRECTION",
  "COUNTER_CONTEXT",
  "OTHER",
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const EVIDENCE_STATUSES = [
  "SUBMITTED",
  "USED_IN_INSCRIPTION",
  "CONTESTED",
  "LOW_CONFIDENCE",
  "REJECTED_AS_UNSUPPORTED",
] as const;

export const MEMORY_STATUSES = [
  "SUBMITTED",
  "INCLUDED",
  "REPETITIVE",
  "CONTESTED",
  "LOW_CREDIBILITY",
] as const;

export const CONTROVERSY_LEVELS = ["LOW", "MEDIUM", "HIGH", "SEVERE"] as const;
export type ControversyLevel = (typeof CONTROVERSY_LEVELS)[number];

export const PRESERVATION_RECOMMENDATIONS = [
  "PRESERVE",
  "PRESERVE_WITH_CONTEXT",
  "CONTESTED_ARCHIVE",
  "INSUFFICIENT_EVIDENCE",
] as const;
export type PreservationRecommendation =
  (typeof PRESERVATION_RECOMMENDATIONS)[number];

export const FRACTURE_TYPES = [
  "FALSE_CLAIM",
  "MISSING_CONTEXT",
  "EXAGGERATED_ACHIEVEMENT",
  "HARMFUL_OMISSION",
  "MALICIOUS_TESTIMONY",
  "IDENTITY_CONFUSION",
  "SOURCE_CREDIBILITY",
  "TONE_IMBALANCE",
  "OTHER",
] as const;
export type FractureType = (typeof FRACTURE_TYPES)[number];

export const FRACTURE_TARGET_TYPES = [
  "VAULT",
  "EVIDENCE",
  "MEMORY",
  "INSCRIPTION",
] as const;
export type FractureTargetType = (typeof FRACTURE_TARGET_TYPES)[number];

export const FRACTURE_STATUSES = [
  "OPEN",
  "UNDER_REVIEW",
  "RESOLVED",
  "UNDETERMINED",
] as const;

export const FRACTURE_RESOLUTIONS = [
  "UPHOLD_ORIGINAL",
  "REVISE_SUMMARY",
  "LOWER_CONFIDENCE",
  "MARK_CONTESTED",
  "REMOVE_UNSUPPORTED_CLAIM",
  "ADD_COUNTER_CONTEXT",
  "SPLIT_INTERPRETATION",
  "UNDETERMINED",
] as const;

export const CONTRACT_METHODS = {
  createLegacyVault: "create_legacy_vault",
  submitEvidence: "submit_evidence",
  submitMemory: "submit_memory",
  requestLegacyInscription: "request_legacy_inscription",
  openFracture: "open_fracture",
  resolveFracture: "resolve_fracture",
  sealVault: "seal_vault",
  getVault: "get_vault",
  getVaultCount: "get_vault_count",
  getVaultIdAt: "get_vault_id_at",
  getEvidence: "get_evidence",
  getEvidenceCount: "get_evidence_count",
  getMemory: "get_memory",
  getMemoryCount: "get_memory_count",
  getInscription: "get_inscription",
  getLatestInscription: "get_latest_inscription",
  getFracture: "get_fracture",
  getFractureCount: "get_fracture_count",
  getFractureIdAt: "get_fracture_id_at",
  getProtocolEvent: "get_protocol_event",
  getProtocolEventCount: "get_protocol_event_count",
} as const;
