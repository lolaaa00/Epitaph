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

async function write(functionName: string, args: unknown[]): Promise<WriteResult> {
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

  const receiptInfo = receipt as {
    statusName?: string;
    txExecutionResultName?: string;
  };
  console.debug("[epitaph:receipt]", functionName, receiptInfo);

  if (receiptInfo.statusName && FAILURE_STATUS_NAMES.has(receiptInfo.statusName)) {
    throw new Error(
      `Transaction for "${functionName}" did not reach consensus (status: ${receiptInfo.statusName}). Nothing was written to the vault — please retry.`
    );
  }
  if (receiptInfo.txExecutionResultName === "FINISHED_WITH_ERROR") {
    throw new Error(
      `Contract rejected "${functionName}": execution failed on-chain. Check submitted values against contract constraints and retry.`
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

export async function createLegacyVault(input: {
  vaultId: string;
  personName: string;
  lifePeriod: string;
  identityLine: string;
  initialClaim: string;
  submitterRelation: string;
  initialEvidenceType: string;
  initialSourceRef: string;
  initialEvidenceDescription: string;
}): Promise<WriteResult> {
  return write(CONTRACT_METHODS.createLegacyVault, [
    input.vaultId,
    input.personName,
    input.lifePeriod,
    input.identityLine,
    input.initialClaim,
    input.submitterRelation,
    input.initialEvidenceType,
    input.initialSourceRef,
    input.initialEvidenceDescription,
  ]);
}

export async function submitEvidence(input: {
  vaultId: string;
  shardId: string;
  evidenceType: string;
  sourceRef: string;
  claimSupported: string;
  description: string;
  credibilityHint: string;
}): Promise<WriteResult> {
  return write(CONTRACT_METHODS.submitEvidence, [
    input.vaultId,
    input.shardId,
    input.evidenceType,
    input.sourceRef,
    input.claimSupported,
    input.description,
    input.credibilityHint,
  ]);
}

export async function submitMemory(input: {
  vaultId: string;
  memoryId: string;
  relationship: string;
  memoryText: string;
  context: string;
}): Promise<WriteResult> {
  return write(CONTRACT_METHODS.submitMemory, [
    input.vaultId,
    input.memoryId,
    input.relationship,
    input.memoryText,
    input.context,
  ]);
}

export async function requestLegacyInscription(vaultId: string): Promise<WriteResult> {
  return write(CONTRACT_METHODS.requestLegacyInscription, [vaultId]);
}

export async function openFracture(input: {
  vaultId: string;
  fractureId: string;
  fractureType: string;
  targetType: string;
  targetId: string;
  claim: string;
  evidenceRef: string;
}): Promise<WriteResult> {
  return write(CONTRACT_METHODS.openFracture, [
    input.vaultId,
    input.fractureId,
    input.fractureType,
    input.targetType,
    input.targetId,
    input.claim,
    input.evidenceRef,
  ]);
}

export async function resolveFracture(fractureId: string): Promise<WriteResult> {
  return write(CONTRACT_METHODS.resolveFracture, [fractureId]);
}

export async function sealVault(vaultId: string): Promise<WriteResult> {
  return write(CONTRACT_METHODS.sealVault, [vaultId]);
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
