#!/usr/bin/env node
/**
 * Verifies every function name (and argument count) the frontend calls
 * against the schema of the actually-deployed contract, via
 * client.getContractSchema(address). This is the check the GenLayer
 * Projects guidance calls out as the single thing that "would have
 * prevented the 'frontend misaligned with contract' rejection" seen on
 * other submissions — run it any time the contract or lib/contract.ts
 * changes, and definitely before every submission.
 *
 * Usage:
 *   node scripts/verify-schema.mjs [contractAddress]
 * Defaults to NEXT_PUBLIC_EPITAPH_CONTRACT_ADDRESS from .env.local.
 */

import { createClient, chains } from "genlayer-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  try {
    const text = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
    const match = text.match(/NEXT_PUBLIC_EPITAPH_CONTRACT_ADDRESS\s*=\s*(\S+)/);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

const address = process.argv[2] ?? loadEnvLocal();

if (!address) {
  console.error(
    "No contract address given and none found in .env.local (NEXT_PUBLIC_EPITAPH_CONTRACT_ADDRESS)."
  );
  process.exit(1);
}

// Every method the frontend actually calls (lib/contract.ts), with the
// exact argument count sent on each call. Kept as a flat list here rather
// than imported from lib/constants.ts so this script has zero build-step
// dependency and can run standalone with `node`.
const EXPECTED_CALLS = [
  ["create_legacy_vault", 9, "write"],
  ["submit_evidence", 7, "write"],
  ["submit_memory", 5, "write"],
  ["request_legacy_inscription", 1, "write"],
  ["open_fracture", 7, "write"],
  ["resolve_fracture", 1, "write"],
  ["seal_vault", 1, "write"],
  ["get_vault", 1, "read"],
  ["get_vault_count", 0, "read"],
  ["get_vault_id_at", 1, "read"],
  ["get_evidence", 2, "read"],
  ["get_evidence_count", 1, "read"],
  ["get_memory", 2, "read"],
  ["get_memory_count", 1, "read"],
  ["get_inscription", 1, "read"],
  ["get_latest_inscription", 1, "read"],
  ["get_fracture", 1, "read"],
  ["get_fracture_count", 1, "read"],
  ["get_fracture_id_at", 2, "read"],
  ["get_protocol_event", 1, "read"],
  ["get_protocol_event_count", 0, "read"],
];

const chain = {
  ...chains.studionet,
  rpcUrls: { default: { http: ["https://studio.genlayer.com/api"] } },
};

const client = createClient({ chain });

console.log(`Fetching schema for ${address}...`);
const schema = await client.getContractSchema(address);
const methods = schema.methods ?? {};

let failures = 0;

for (const [name, expectedArgCount, kind] of EXPECTED_CALLS) {
  const method = methods[name];
  if (!method) {
    console.error(`✗ MISSING  ${name} — frontend calls this ${kind} method but it is not in the deployed schema`);
    failures++;
    continue;
  }

  const actualArgCount = (method.params ?? []).length;
  const expectedReadonly = kind === "read";
  const mismatches = [];

  if (actualArgCount !== expectedArgCount) {
    mismatches.push(`arity: frontend sends ${expectedArgCount} args, schema declares ${actualArgCount}`);
  }
  if (Boolean(method.readonly) !== expectedReadonly) {
    mismatches.push(
      `kind: frontend treats this as a ${kind}, schema says readonly=${method.readonly}`
    );
  }

  if (mismatches.length > 0) {
    console.error(`✗ MISMATCH ${name} — ${mismatches.join("; ")}`);
    failures++;
  } else {
    console.log(`✓ ${name} (${actualArgCount} args, ${kind})`);
  }
}

const deployedOnly = Object.keys(methods).filter(
  (name) => !EXPECTED_CALLS.some(([n]) => n === name)
);
if (deployedOnly.length > 0) {
  console.log(
    `\nInfo: deployed contract also exposes methods the frontend never calls: ${deployedOnly.join(", ")}`
  );
}

if (failures > 0) {
  console.error(`\n${failures} mismatch(es) found between the frontend and the deployed contract schema.`);
  process.exit(1);
}

console.log(`\nAll ${EXPECTED_CALLS.length} frontend call sites match the deployed contract schema.`);
