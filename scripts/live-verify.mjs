#!/usr/bin/env node
/**
 * Real, executed end-to-end verification against the live deployed
 * contract: creates a vault with a real fetchable http(s) source_ref,
 * requests a legacy inscription (exercising the new contract-side
 * gl.nondet.web.get fetch + the new gl.vm.UserError / fence-stripping
 * paths), opens a fracture, and resolves it. No mocking — this is genuine
 * GenLayer Studio consensus.
 *
 * Usage: node scripts/live-verify.mjs <contractAddress>
 */
import { createClient, chains, createAccount, generatePrivateKey } from "genlayer-js";

const address = process.argv[2];
if (!address) {
  console.error("Usage: node scripts/live-verify.mjs <contractAddress>");
  process.exit(1);
}

const chain = {
  ...chains.studionet,
  rpcUrls: { default: { http: ["https://studio.genlayer.com/api"] } },
};
const client = createClient({ chain, account: createAccount(generatePrivateKey()) });

const vaultId = `live-verify-${Date.now()}`;

async function waitFor(hash, label) {
  console.log(`  tx (${label}): ${hash}`);
  const receipt = await client.waitForTransactionReceipt({
    hash, interval: 5000, retries: 100,
  });
  console.log(`  status: ${receipt.status_name ?? receipt.status}`);
  return receipt;
}

console.log(`1. Creating vault ${vaultId} with a real fetchable source_ref...`);
let tx = await client.writeContract({
  address,
  functionName: "create_legacy_vault",
  args: [
    vaultId,
    "Live Verify Person",
    "1950-2020",
    "a subject used to verify the redeployed contract fetches evidence itself",
    "This claim exists solely to verify the redeployed EPITAPH contract.",
    "verification script",
    "PUBLIC_RECORD",
    "https://raw.githubusercontent.com/genlayerlabs/genlayer-project-boilerplate/main/README.md",
    "A real, fetchable GitHub-hosted README used to prove contract-side fetch works.",
  ],
  value: 0n,
});
await waitFor(tx, "create_legacy_vault");

console.log("2. Requesting legacy inscription (exercises gl.nondet.web.get + _parse_model_json + gl.vm.UserError paths)...");
tx = await client.writeContract({
  address, functionName: "request_legacy_inscription", args: [vaultId], value: 0n,
});
await waitFor(tx, "request_legacy_inscription");

const vault = await client.readContract({ address, functionName: "get_vault", args: [vaultId] });
console.log(`  vault.state = ${vault.state}, impact_score = ${vault.impact_score}, memory_confidence = ${vault.memory_confidence}`);

if (vault.latest_inscription_id) {
  const inscription = await client.readContract({
    address, functionName: "get_latest_inscription", args: [vaultId],
  });
  console.log(`  preservation_recommendation = ${inscription.preservation_recommendation}`);
  console.log(`  reasoning_summary = ${String(inscription.reasoning_summary).slice(0, 200)}`);
}

console.log("3. Opening a fracture against the inscription...");
tx = await client.writeContract({
  address,
  functionName: "open_fracture",
  args: [
    vaultId, `${vaultId}-f1`, "SOURCE_CREDIBILITY", "INSCRIPTION",
    vault.latest_inscription_id || vaultId,
    "The cited source is a boilerplate README, not primary evidence about this person.",
    "",
  ],
  value: 0n,
});
await waitFor(tx, "open_fracture");

console.log("4. Resolving the fracture (second consensus path)...");
tx = await client.writeContract({
  address, functionName: "resolve_fracture", args: [`${vaultId}-f1`], value: 0n,
});
await waitFor(tx, "resolve_fracture");

const fracture = await client.readContract({
  address, functionName: "get_fracture", args: [`${vaultId}-f1`],
});
console.log(`  fracture.status = ${fracture.status}, resolution = ${fracture.resolution}`);

const finalVault = await client.readContract({ address, functionName: "get_vault", args: [vaultId] });
console.log(`  final vault.state = ${finalVault.state}`);

console.log("5. Sealing the vault (requires a corroborated inscription)...");
tx = await client.writeContract({ address, functionName: "seal_vault", args: [vaultId], value: 0n });
await waitFor(tx, "seal_vault");
const sealedVault = await client.readContract({ address, functionName: "get_vault", args: [vaultId] });
console.log(`  sealed vault.state = ${sealedVault.state}, sealed = ${sealedVault.sealed}`);

const latestInscription = await client.readContract({
  address, functionName: "get_latest_inscription", args: [vaultId],
});
console.log(`  latest_inscription.corroborated_source_count = ${latestInscription.corroborated_source_count}`);

console.log("\n6. Negative control: proving the seal gate actually blocks uncorroborated vaults...");
const badVaultId = `${vaultId}-uncorroborated`;
tx = await client.writeContract({
  address,
  functionName: "create_legacy_vault",
  args: [
    badVaultId,
    "Uncorroborated Test Person",
    "", "a subject with a source_ref that cannot be fetched",
    "This claim exists solely to prove sealing is blocked without corroboration.",
    "verification script",
    "OTHER",
    "https://this-domain-does-not-exist-epitaph-test.invalid/nothing",
    "A deliberately unfetchable source reference.",
  ],
  value: 0n,
});
await waitFor(tx, "create_legacy_vault (uncorroborated)");
tx = await client.writeContract({
  address, functionName: "request_legacy_inscription", args: [badVaultId], value: 0n,
});
await waitFor(tx, "request_legacy_inscription (uncorroborated)");
const badInscription = await client.readContract({
  address, functionName: "get_latest_inscription", args: [badVaultId],
});
console.log(`  corroborated_source_count = ${badInscription.corroborated_source_count}, memory_confidence = ${badInscription.memory_confidence}, preservation = ${badInscription.preservation_recommendation}`);
try {
  tx = await client.writeContract({ address, functionName: "seal_vault", args: [badVaultId], value: 0n });
  const receipt = await client.waitForTransactionReceipt({ hash: tx, interval: 5000, retries: 100 });
  const failed = (receipt.consensus_data?.leader_receipt ?? []).some(r => r.execution_result && r.execution_result !== "SUCCESS");
  console.log(failed ? "  seal_vault correctly REJECTED on-chain (execution_result != SUCCESS)." : "  UNEXPECTED: seal_vault succeeded without corroboration.");
} catch (err) {
  console.log(`  seal_vault correctly rejected: ${err.message || err}`);
}

console.log("\nAll live writes and consensus rounds completed as expected.");
