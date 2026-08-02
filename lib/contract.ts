"use client";

import { CONTRACT_ADDRESS, CONTRACT_METHODS } from "./constants";
import { getReadClient, getWriteClient, getConnectedAccount } from "./genlayerClient";
import { queuedRpcCall } from "./rpcQueue";
import {
  fromVaultCalldata,
  fromEvidenceCalldata,
  fromMemoryCalldata,
  fromInscriptionCalldata,
  fromFractureCalldata,
  fromProtocolEventCalldata,
  type LegacyVault,
  type EvidenceShard,
  type MemoryTrace,
  type LegacyInscription,
  type FractureRecord,
  type ProtocolEvent,
} from "./formatters";

export interface WriteResult {
  txHash: `0x${string}`;
}

/**
 * Best-effort read of a transaction's current stage (PROPOSING, COMMITTING,
 * REVEALING, ACCEPTED, FINALIZED, ...). Used purely for UI progress display
 * while a write's own waitForTransactionReceipt() call is still in flight —
 * never for correctness decisions. Returns null on any error, including
 * "not found yet" right after submission, so callers should treat null as
 * "still pending" rather than a failure.
 */
export async function fetchTransactionStatusName(txHash: string): Promise<string | null> {
  try {
    const client = getReadClient();
    const tx = await client.getTransaction({
      hash: txHash as unknown as Parameters<typeof client.getTransaction>[0]["hash"],
    });
    const info = tx as unknown as { status_name?: string; status?: string };
    return info.status_name ?? info.status ?? null;
  } catch {
    return null;
  }
}

function requireContractAddress(): `0x${string}` {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "EPITAPH contract address is not configured. Set NEXT_PUBLIC_EPITAPH_CONTRACT_ADDRESS."
    );
  }
  return CONTRACT_ADDRESS as `0x${string}`;
}

function logRpcCall(kind: "write" | "read", functionName: string, args: unknown[], address: string) {
  console.debug(`[epitaph:${kind}]`, {
    contractAddress: address,
    functionName,
    args,
    value: kind === "write" ? "0" : undefined,
    account: getConnectedAccount(),
    timestamp: new Date().toISOString(),
  });
}

// waitForTransactionReceipt resolves (does not throw) on any "decided" GenLayer
// status, which includes several non-success outcomes: consensus never
// settling, appeal timeouts, or the tx being canceled. Treating "resolved"
// as "succeeded" let the UI navigate to vaults that were never actually
// created whenever a write landed in one of these states instead of ACCEPTED
// or FINALIZED.
const FAILURE_STATUS_NAMES = new Set([
  "UNDETERMINED",
  "CANCELED",
  "LEADER_TIMEOUT",
  "VALIDATORS_TIMEOUT",
]);

// The real GenLayer receipt object uses snake_case keys (status_name,
// result_name), not the camelCase names the SDK's TS types suggest — and
// crucially, even a call that *raised inside the contract* (e.g. a Python
// exception) can still show a top-level status_name of ACCEPTED and a
// result_name of MAJORITY_AGREE, because validators unanimously agreeing
// "this call errors" is itself a valid consensus outcome. The only place
// that actually reflects whether contract execution succeeded is each
// round's consensus_data.leader_receipt[].execution_result. Confirmed
// empirically against a live Studio deployment: a successful call reports
// execution_result "SUCCESS" for every leader receipt, while a call that
// raises reports "ERROR" with a Python traceback in genvm_result.stderr.
interface LeaderReceiptEntry {
  execution_result?: string;
  genvm_result?: { stderr?: string };
}

interface GenLayerReceiptShape {
  status_name?: string;
  result_name?: string;
  consensus_data?: { leader_receipt?: LeaderReceiptEntry[] };
}

async function write(
  functionName: string,
  args: unknown[],
  onSubmitted?: (txHash: string) => void
): Promise<WriteResult> {
  const client = getWriteClient();
  const address = requireContractAddress();
  logRpcCall("write", functionName, args, address);
  const txHash = await queuedRpcCall(() =>
    client.writeContract({
      address,
      functionName,
      args: args as Parameters<typeof client.writeContract>[0]["args"],
      value: 0n,
    })
  );
  // Surface the hash immediately so the UI can start showing live consensus
  // progress (PROPOSING/COMMITTING/REVEALING/...) instead of waiting for
  // the whole multi-minute wait below to resolve before showing anything.
  onSubmitted?.(txHash as string);
  // Studio Network consensus rounds can take a while under load, so a
  // generous interval/retry budget (~5 minutes total) is used instead of
  // the client default so slow finalization isn't mistaken for failure.
  const receipt = await queuedRpcCall(() =>
    client.waitForTransactionReceipt({
      hash: txHash as unknown as Parameters<typeof client.waitForTransactionReceipt>[0]["hash"],
      interval: 3000,
      retries: 100,
    })
  );

  const receiptInfo = receipt as unknown as GenLayerReceiptShape;
  console.debug("[epitaph:receipt]", functionName, receiptInfo);

  if (receiptInfo.status_name && FAILURE_STATUS_NAMES.has(receiptInfo.status_name)) {
    throw new Error(
      `Transaction for "${functionName}" did not reach consensus (status: ${receiptInfo.status_name}). Nothing was written to the vault — please retry.`
    );
  }

  const leaderReceipts = receiptInfo.consensus_data?.leader_receipt ?? [];
  const failedReceipt = leaderReceipts.find(
    (entry) => entry.execution_result && entry.execution_result !== "SUCCESS"
  );
  if (failedReceipt) {
    const stderrTail = failedReceipt.genvm_result?.stderr?.trim().split("\n").slice(-1)[0];
    throw new Error(
      `Contract rejected "${functionName}": execution failed on-chain (${failedReceipt.execution_result}).` +
        (stderrTail ? ` ${stderrTail}` : " Check submitted values against contract constraints and retry.")
    );
  }

  return { txHash: txHash as `0x${string}` };
}

async function read<T>(functionName: string, args: unknown[] = []): Promise<T> {
  const client = getReadClient();
  const address = requireContractAddress();
  logRpcCall("read", functionName, args, address);
  return queuedRpcCall(
    async () =>
      (await client.readContract({
        address,
        functionName,
        args: args as Parameters<typeof client.readContract>[0]["args"],
      })) as T
  );
}

// ── Writes ───────────────────────────────────────────────────────────────

export async function createLegacyVault(
  input: {
    vaultId: string;
    personName: string;
    lifePeriod: string;
    identityLine: string;
    initialClaim: string;
    submitterRelation: string;
    initialEvidenceType: string;
    initialSourceRef: string;
    initialEvidenceDescription: string;
  },
  onSubmitted?: (txHash: string) => void
): Promise<WriteResult> {
  return write(
    CONTRACT_METHODS.createLegacyVault,
    [
      input.vaultId,
      input.personName,
      input.lifePeriod,
      input.identityLine,
      input.initialClaim,
      input.submitterRelation,
      input.initialEvidenceType,
      input.initialSourceRef,
      input.initialEvidenceDescription,
    ],
    onSubmitted
  );
}

export async function submitEvidence(
  input: {
    vaultId: string;
    shardId: string;
    evidenceType: string;
    sourceRef: string;
    claimSupported: string;
    description: string;
    credibilityHint: string;
  },
  onSubmitted?: (txHash: string) => void
): Promise<WriteResult> {
  return write(
    CONTRACT_METHODS.submitEvidence,
    [
      input.vaultId,
      input.shardId,
      input.evidenceType,
      input.sourceRef,
      input.claimSupported,
      input.description,
      input.credibilityHint,
    ],
    onSubmitted
  );
}

export async function submitMemory(
  input: {
    vaultId: string;
    memoryId: string;
    relationship: string;
    memoryText: string;
    context: string;
  },
  onSubmitted?: (txHash: string) => void
): Promise<WriteResult> {
  return write(
    CONTRACT_METHODS.submitMemory,
    [input.vaultId, input.memoryId, input.relationship, input.memoryText, input.context],
    onSubmitted
  );
}

export async function requestLegacyInscription(
  vaultId: string,
  onSubmitted?: (txHash: string) => void
): Promise<WriteResult> {
  return write(CONTRACT_METHODS.requestLegacyInscription, [vaultId], onSubmitted);
}

export async function openFracture(
  input: {
    vaultId: string;
    fractureId: string;
    fractureType: string;
    targetType: string;
    targetId: string;
    claim: string;
    evidenceRef: string;
  },
  onSubmitted?: (txHash: string) => void
): Promise<WriteResult> {
  return write(
    CONTRACT_METHODS.openFracture,
    [
      input.vaultId,
      input.fractureId,
      input.fractureType,
      input.targetType,
      input.targetId,
      input.claim,
      input.evidenceRef,
    ],
    onSubmitted
  );
}

export async function resolveFracture(
  fractureId: string,
  onSubmitted?: (txHash: string) => void
): Promise<WriteResult> {
  return write(CONTRACT_METHODS.resolveFracture, [fractureId], onSubmitted);
}

export async function sealVault(
  vaultId: string,
  onSubmitted?: (txHash: string) => void
): Promise<WriteResult> {
  return write(CONTRACT_METHODS.sealVault, [vaultId], onSubmitted);
}

// ── Reads ────────────────────────────────────────────────────────────────

export async function readVault(vaultId: string): Promise<LegacyVault> {
  return fromVaultCalldata(await read(CONTRACT_METHODS.getVault, [vaultId]));
}

export async function readVaultCount(): Promise<number> {
  return Number(await read<number | bigint>(CONTRACT_METHODS.getVaultCount));
}

export async function readVaultIdAt(index: number): Promise<string> {
  return read<string>(CONTRACT_METHODS.getVaultIdAt, [index]);
}

export async function readVaults(): Promise<LegacyVault[]> {
  const count = await readVaultCount();
  const ids = await Promise.all(
    Array.from({ length: count }, (_, i) => readVaultIdAt(i))
  );
  return Promise.all(ids.map((id) => readVault(id)));
}

export async function readEvidenceCount(vaultId: string): Promise<number> {
  return Number(await read<number | bigint>(CONTRACT_METHODS.getEvidenceCount, [vaultId]));
}

export async function readEvidenceAt(vaultId: string, index: number): Promise<EvidenceShard> {
  return fromEvidenceCalldata(
    await read(CONTRACT_METHODS.getEvidence, [vaultId, index])
  );
}

export async function readEvidenceArchive(vaultId: string): Promise<EvidenceShard[]> {
  const count = await readEvidenceCount(vaultId);
  return Promise.all(
    Array.from({ length: count }, (_, i) => readEvidenceAt(vaultId, i))
  );
}

export async function readMemoryCount(vaultId: string): Promise<number> {
  return Number(await read<number | bigint>(CONTRACT_METHODS.getMemoryCount, [vaultId]));
}

export async function readMemoryAt(vaultId: string, index: number): Promise<MemoryTrace> {
  return fromMemoryCalldata(await read(CONTRACT_METHODS.getMemory, [vaultId, index]));
}

export async function readMemoryTraces(vaultId: string): Promise<MemoryTrace[]> {
  const count = await readMemoryCount(vaultId);
  return Promise.all(Array.from({ length: count }, (_, i) => readMemoryAt(vaultId, i)));
}

export async function readInscription(inscriptionId: string): Promise<LegacyInscription> {
  return fromInscriptionCalldata(
    await read(CONTRACT_METHODS.getInscription, [inscriptionId])
  );
}

export async function readLatestInscription(
  vaultId: string
): Promise<LegacyInscription | null> {
  try {
    return fromInscriptionCalldata(
      await read(CONTRACT_METHODS.getLatestInscription, [vaultId])
    );
  } catch {
    return null;
  }
}

export async function readFracture(fractureId: string): Promise<FractureRecord> {
  return fromFractureCalldata(await read(CONTRACT_METHODS.getFracture, [fractureId]));
}

export async function readFractureCount(vaultId: string): Promise<number> {
  return Number(await read<number | bigint>(CONTRACT_METHODS.getFractureCount, [vaultId]));
}

export async function readFractureIdAt(vaultId: string, index: number): Promise<string> {
  return read<string>(CONTRACT_METHODS.getFractureIdAt, [vaultId, index]);
}

export async function readFractures(vaultId: string): Promise<FractureRecord[]> {
  const count = await readFractureCount(vaultId);
  const ids = await Promise.all(
    Array.from({ length: count }, (_, i) => readFractureIdAt(vaultId, i))
  );
  return Promise.all(ids.map((id) => readFracture(id)));
}

export async function readProtocolEventCount(): Promise<number> {
  return Number(await read<number | bigint>(CONTRACT_METHODS.getProtocolEventCount));
}

export async function readProtocolEventAt(index: number): Promise<ProtocolEvent> {
  return fromProtocolEventCalldata(
    await read(CONTRACT_METHODS.getProtocolEvent, [index])
  );
}

export async function readRecentProtocolEvents(limit = 20): Promise<ProtocolEvent[]> {
  const count = await readProtocolEventCount();
  const start = Math.max(0, count - limit);
  const indices = Array.from({ length: count - start }, (_, i) => start + i);
  const items = await Promise.all(indices.map((i) => readProtocolEventAt(i)));
  return items.reverse();
}
