import type {
  ControversyLevel,
  EvidenceType,
  FractureType,
  FractureTargetType,
  PreservationRecommendation,
  VaultState,
} from "./constants";

export interface LegacyVault {
  vaultId: string;
  personName: string;
  lifePeriod: string;
  identityLine: string;
  initialClaim: string;
  submitter: string;
  submitterRelation: string;
  state: VaultState;
  createdAt: number;
  evidenceCount: number;
  memoryCount: number;
  fractureCount: number;
  latestInscriptionId: string;
  impactScore: number;
  memoryConfidence: number;
  controversyLevel: ControversyLevel;
  sealed: boolean;
}

export interface EvidenceShard {
  shardId: string;
  vaultId: string;
  submitter: string;
  evidenceType: EvidenceType;
  sourceRef: string;
  claimSupported: string;
  description: string;
  credibilityHint: string;
  createdAt: number;
  status: string;
}

export interface MemoryTrace {
  memoryId: string;
  vaultId: string;
  submitter: string;
  relationship: string;
  memoryText: string;
  context: string;
  createdAt: number;
  status: string;
}

export interface LegacyInscription {
  inscriptionId: string;
  vaultId: string;
  legacySummary: string;
  contributionAssessment: string;
  historicalProfile: string;
  impactScore: number;
  memoryConfidence: number;
  controversyLevel: ControversyLevel;
  preservationRecommendation: PreservationRecommendation;
  contestedLines: string;
  reasoningSummary: string;
  createdAt: number;
  supersedesInscriptionId: string;
}

export interface FractureRecord {
  fractureId: string;
  vaultId: string;
  openedBy: string;
  fractureType: FractureType;
  targetType: FractureTargetType;
  targetId: string;
  claim: string;
  evidenceRef: string;
  status: string;
  resolution: string;
  resolutionSummary: string;
  createdAt: number;
  resolvedAt: number;
}

export interface ProtocolEvent {
  eventId: string;
  eventType: string;
  vaultId: string;
  refId: string;
  summary: string;
  createdAt: number;
}

/**
 * genlayer-js decodes contract dataclass return values as plain objects (or
 * Maps, depending on SDK version) keyed by the original Python snake_case
 * field names. These helpers normalize either shape into typed camelCase
 * records the UI can render directly.
 */
function field(raw: unknown, key: string): unknown {
  if (raw instanceof Map) return raw.get(key);
  if (raw && typeof raw === "object") return (raw as Record<string, unknown>)[key];
  return undefined;
}

function asString(raw: unknown, key: string): string {
  const value = field(raw, key);
  return value === undefined || value === null ? "" : String(value);
}

function asNumber(raw: unknown, key: string): number {
  const value = field(raw, key);
  if (value === undefined || value === null) return 0;
  return Number(value);
}

function asBool(raw: unknown, key: string): boolean {
  return Boolean(field(raw, key));
}

export function fromVaultCalldata(raw: unknown): LegacyVault {
  return {
    vaultId: asString(raw, "vault_id"),
    personName: asString(raw, "person_name"),
    lifePeriod: asString(raw, "life_period"),
    identityLine: asString(raw, "identity_line"),
    initialClaim: asString(raw, "initial_claim"),
    submitter: asString(raw, "submitter"),
    submitterRelation: asString(raw, "submitter_relation"),
    state: asString(raw, "state") as VaultState,
    createdAt: asNumber(raw, "created_at"),
    evidenceCount: asNumber(raw, "evidence_count"),
    memoryCount: asNumber(raw, "memory_count"),
    fractureCount: asNumber(raw, "fracture_count"),
    latestInscriptionId: asString(raw, "latest_inscription_id"),
    impactScore: asNumber(raw, "impact_score"),
    memoryConfidence: asNumber(raw, "memory_confidence"),
    controversyLevel: asString(raw, "controversy_level") as ControversyLevel,
    sealed: asBool(raw, "sealed"),
  };
}

export function fromEvidenceCalldata(raw: unknown): EvidenceShard {
  return {
    shardId: asString(raw, "shard_id"),
    vaultId: asString(raw, "vault_id"),
    submitter: asString(raw, "submitter"),
    evidenceType: asString(raw, "evidence_type") as EvidenceType,
    sourceRef: asString(raw, "source_ref"),
    claimSupported: asString(raw, "claim_supported"),
    description: asString(raw, "description"),
    credibilityHint: asString(raw, "credibility_hint"),
    createdAt: asNumber(raw, "created_at"),
    status: asString(raw, "status"),
  };
}

export function fromMemoryCalldata(raw: unknown): MemoryTrace {
  return {
    memoryId: asString(raw, "memory_id"),
    vaultId: asString(raw, "vault_id"),
    submitter: asString(raw, "submitter"),
    relationship: asString(raw, "relationship"),
    memoryText: asString(raw, "memory_text"),
    context: asString(raw, "context"),
    createdAt: asNumber(raw, "created_at"),
    status: asString(raw, "status"),
  };
}

export function fromInscriptionCalldata(raw: unknown): LegacyInscription {
  return {
    inscriptionId: asString(raw, "inscription_id"),
    vaultId: asString(raw, "vault_id"),
    legacySummary: asString(raw, "legacy_summary"),
    contributionAssessment: asString(raw, "contribution_assessment"),
    historicalProfile: asString(raw, "historical_profile"),
    impactScore: asNumber(raw, "impact_score"),
    memoryConfidence: asNumber(raw, "memory_confidence"),
    controversyLevel: asString(raw, "controversy_level") as ControversyLevel,
    preservationRecommendation: asString(
      raw,
      "preservation_recommendation"
    ) as PreservationRecommendation,
    contestedLines: asString(raw, "contested_lines"),
    reasoningSummary: asString(raw, "reasoning_summary"),
    createdAt: asNumber(raw, "created_at"),
    supersedesInscriptionId: asString(raw, "supersedes_inscription_id"),
  };
}

export function fromFractureCalldata(raw: unknown): FractureRecord {
  return {
    fractureId: asString(raw, "fracture_id"),
    vaultId: asString(raw, "vault_id"),
    openedBy: asString(raw, "opened_by"),
    fractureType: asString(raw, "fracture_type") as FractureType,
    targetType: asString(raw, "target_type") as FractureTargetType,
    targetId: asString(raw, "target_id"),
    claim: asString(raw, "claim"),
    evidenceRef: asString(raw, "evidence_ref"),
    status: asString(raw, "status"),
    resolution: asString(raw, "resolution"),
    resolutionSummary: asString(raw, "resolution_summary"),
    createdAt: asNumber(raw, "created_at"),
    resolvedAt: asNumber(raw, "resolved_at"),
  };
}

export function fromProtocolEventCalldata(raw: unknown): ProtocolEvent {
  return {
    eventId: asString(raw, "event_id"),
    eventType: asString(raw, "event_type"),
    vaultId: asString(raw, "vault_id"),
    refId: asString(raw, "ref_id"),
    summary: asString(raw, "summary"),
    createdAt: asNumber(raw, "created_at"),
  };
}

export function truncateHash(hash: string, lead = 6, trail = 4): string {
  if (!hash || hash.length <= lead + trail + 3) return hash;
  return `${hash.slice(0, lead)}...${hash.slice(-trail)}`;
}

export function formatTick(tick: number): string {
  return `tick ${tick}`;
}

export function formatScore(score: number): string {
  return `${Math.round(score)} / 100`;
}

export function formatPercent(score: number): string {
  return `${Math.round(score)}%`;
}
