# EPITAPH

**The archive that lets memory be judged, challenged, and preserved by consensus.**

## What it is

EPITAPH is a GenLayer-native legacy preservation protocol. A user opens a
Legacy Vault for a person, submits evidence and community memories against
it, then requests a GenLayer Intelligent Contract to run real
non-deterministic validator consensus that produces a legacy summary,
impact score, memory confidence, controversy level, and preservation
recommendation. Disputes ("Fractures") can be raised against any part of
the record and resolved through a second, independent consensus round that
can revise the summary, lower confidence, or add counter-context.

Frontend and Intelligent Contract only — no backend, no database. The
contract in `contracts/EpitaphLegacyProtocol.py` is the canonical memory
ledger; the frontend reads and writes directly to it via `genlayer-js`.

## The problem, and why it needs GenLayer

A memorial page, a Wikipedia-style biography, or a company's "about the
founder" page is written and moderated by a single party — the platform, a
family member, an employer. Whoever controls the page controls the record,
and every reader has to trust that party's judgment on contested,
often-emotional claims.

**Counterfactual:** delete GenLayer from this design and a single submitter
or moderator decides what a person's legacy record says, permanently, with
no independent adjudication of disputes. That is the exact single-party-
must-be-trusted problem this project exists to avoid.

**Two distrusting parties:** the person submitting favorable evidence about
someone, and the person opening a Fracture to dispute a specific claim,
achievement, or omission. Their interests are directly opposed on the
contested point.

**Irreducibly semantic:** whether a set of testimonials supports a claimed
level of "impact," whether a dispute is a false claim or missing context,
and how controversial a record should be classified are judgment calls — not
something a regex or a price feed resolves.

A full account of the idea space considered before choosing this shape,
including gate-by-gate justification and an honest self-audit of where the
final build is and isn't well-rounded across GenLayer's capability surface,
is in [`DECISION_RECORD.md`](DECISION_RECORD.md).

## How consensus is used

Two contract methods run real `gl.eq_principle.prompt_comparative` consensus
— never `prompt_non_comparative`, which the GenLayer ecosystem has flagged
as vulnerable to a single malicious leader dictating an outcome. Both
principles compare **meaning**, not exact wording, and both were designed to
make validators agree on a **category or bounded range**, not a float:

**`request_legacy_inscription`** — quoted principle:

> Two interpretations of the same legacy evidence packet are equivalent only
> if: (1) preservation_recommendation is exactly the same value; (2)
> controversy_level is the same value or an adjacent severity level
> (LOW/MEDIUM or MEDIUM/HIGH or HIGH/SEVERE, never LOW/HIGH or LOW/SEVERE);
> (3) impact_score values are within 15 points of each other; (4)
> memory_confidence values are within 15 points of each other; (5) the
> reasoning identifies substantially similar major factors; (6) neither
> summary invents a major achievement, credential, or harmful allegation
> that is absent from the evidence packet; (7) neither summary contradicts
> the submitted evidence packet. Differences in wording, tone, or sentence
> structure must NOT cause disagreement. Do not require the JSON outputs to
> be textually identical.

**`resolve_fracture`** — quoted principle:

> Two adjudications of the same fracture are equivalent only if: (1)
> resolution is exactly the same category; (2) impact_score_delta has the
> same sign (both non-negative or both non-positive, treating values within
> 5 of zero as neutral); (3) confidence_delta has the same sign under the
> same tolerance; (4) the legacies agree on whether the record becomes more
> contested, less contested, or unchanged in controversy_level direction.
> Exact wording of resolution_summary or revised_legacy_summary must NOT be
> required to match. Do not require the JSON outputs to be textually
> identical.

### Evidence the contract fetches itself (Gate D)

Early in this build, every `source_ref` a submitter attached to a piece of
evidence was treated as trustworthy just because it was a URL — the model
never actually saw whether that URL existed or what it contained. That is
the exact "stable URL content treated as proof of ownership" failure other
GenLayer submissions have been flagged for. It's fixed now: both consensus
methods fetch up to 3 http(s) `source_ref` values directly via
`gl.nondet.web.get`, from inside the leader closure, and the prompt
instructs validators to weigh a successful contract-fetched confirmation
above an identical but unverified submitter claim. A failed fetch is
surfaced as *unverified*, never as proof the claim is false. Non-http(s)
references (e.g. `ipfs://`) are labeled as not attempted rather than
silently ignored.

This is proven working on live consensus, not just asserted — see
"Measured real results" below.

### What's deliberately deterministic

Every write except the two consensus methods above is fully deterministic:
field-length bounds, enum validation, ID format checks, prompt-injection
phrase rejection, sealed-vault guards, and all storage bookkeeping. The
model is only ever asked what the evidence supports — never asked to decide
access control, validation, or contract state transitions itself. This
narrows the non-determinism budget to exactly the two places where genuine
judgment is required, which is what makes the equivalence principles above
tractable to write precisely.

## Architecture

```
Browser (injected wallet: MetaMask or any EIP-6963 wallet)
   │  genlayer-js 1.1.8 — reads via a throwaway client, writes via the
   │  connected wallet's provider, same address for both
   ▼
Next.js App Router frontend (this repo)
   │  lib/contract.ts — every functionName call, verified against the
   │  live deployed schema by scripts/verify-schema.mjs
   ▼
EpitaphLegacyProtocol.py — GenLayer Intelligent Contract, StudioNet (61999)
   - deterministic writes: create_legacy_vault, submit_evidence,
     submit_memory, open_fracture, seal_vault
   - non-deterministic writes (own transaction, isolated latency):
     request_legacy_inscription, resolve_fracture
   - contract-fetched verification via gl.nondet.web.get, inside the
     leader closure of both consensus methods
```

## The wallet model

Connects to any EIP-6963-announcing injected wallet (MetaMask, or any
other GenLayer-compatible extension); if more than one is installed, the
user is prompted to pick which one explicitly rather than silently
connecting through whichever wallet wins the `window.ethereum` race. On
connect, the app calls `wallet_switchEthereumChain` / `wallet_addEthereumChain`
to put the wallet on GenLayer Studio (61999) if it isn't already there —
this is the step that was originally missing and caused the "wallet sign-in
doesn't pop up" issue during development. Reads use a throwaway client when
no wallet is connected and the connected wallet's own client once one is;
the same address is used for both once connected, so what's displayed is
always what would sign a write.

**Known limitation:** there is currently no generated/browser-wallet
fallback — a visitor without an injected wallet extension can browse
(`/vaults`, individual vault pages) but cannot open a vault, submit
evidence, or trigger consensus. This is the one gap intentionally left open
in this pass; injected-wallet support was hardened instead.

## Deployed contract

- **Contract address:** `0x1320efcEed8c325E432d24CA40A0835B742e87af`
- **Network:** GenLayer Studio Network, chain `61999`
- **RPC:** `https://studio.genlayer.com/api`
- **Explorer:** https://explorer-studio.genlayer.com/address/0x1320efcEed8c325E432d24CA40A0835B742e87af
- **Live app:** https://epitaph-two.vercel.app

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Connect an injected
wallet and confirm the network prompt — the app switches/adds GenLayer
Studio automatically.

### Environment variables

```bash
NEXT_PUBLIC_EPITAPH_CONTRACT_ADDRESS=0x1320efcEed8c325E432d24CA40A0835B742e87af
```

The only environment variable the app reads (verified by grepping the
entire codebase for `process.env`). It's public (`NEXT_PUBLIC_*`) since
it's just the deployed contract address, not a secret.

## Testing

```bash
# Contract-side, offline, no network — Foundry-style simulator fixtures
# (direct_vm, mock_llm, mock_web, expect_revert, ...)
pytest tests/direct/ -v

# Schema alignment: every frontend functionName + arg count checked against
# the live deployed contract's actual schema
npm run verify-schema

# Real live-network end-to-end proof (writes real GEN-free transactions
# to Studio, real consensus, no mocking)
node scripts/live-verify.mjs <contractAddress>
```

`tests/integration/test_smoke.py` and `gltest.config.yaml` exist for
`gltest`-framework integration testing against StudioNet, but running them
in this development environment hit a `gltest`-package-side issue
(`Failed to get schema from all clients` immediately after a successful
deploy call) that direct network calls via `genlayer-js` do not hit — see
"Honest limits" below. `scripts/live-verify.mjs` was written as a working
substitute that exercises the same real-network path.

## Measured real results

**Direct-mode tests:** 33/33 passing (`pytest tests/direct/ -v`), covering
vault creation validation (bounds, enum checks, injection-phrase rejection,
duplicate IDs), evidence/memory submission, both consensus methods
(including malformed/fenced-markdown/commentary-wrapped model output
recovery, fetch-success and fetch-failure paths), fracture lifecycle,
abstention states, and read-path bounds checking. One of these tests
initially failed during development because of a test-authoring mistake
(two `mock_llm` registrations using an identical wildcard pattern, so the
second silently never took effect) — not a contract bug; documented in the
test file itself as a note for anyone extending the suite.

**Schema verification:** all 21 frontend call sites (7 writes, 14 reads)
match the live deployed contract's actual schema (`npm run verify-schema`).

**Live end-to-end run** against the currently deployed contract
(`node scripts/live-verify.mjs 0x1320efcEed8c325E432d24CA40A0835B742e87af`),
full transcript:

```
1. Creating vault with a real fetchable source_ref...
  tx (create_legacy_vault): 0x53596078adf48abe884d3c21377084abd08c959a0400f66fc1ca642a4a7ca17b
  status: ACCEPTED
2. Requesting legacy inscription (exercises gl.nondet.web.get + _parse_model_json + gl.vm.UserError paths)...
  tx (request_legacy_inscription): 0x7408b91925270fa241027603e9ad8ec1537cbe3973ed5bffdca96815fda3fec5
  status: ACCEPTED
  vault.state = INSCRIBED, impact_score = 8, memory_confidence = 72
  preservation_recommendation = PRESERVE_WITH_CONTEXT
  reasoning_summary = "Confidence is relatively high for the narrow claim
    because the contract directly fetched the cited GitHub README with
    HTTP 200, which materially strengthens verification that external
    evidence retriev[al succeeded]..."
3. Opening a fracture against the inscription...
  tx (open_fracture): 0x79c6d376a6bcd04cd8f25d4bf94fcc6eb684130dfcafec8320e511c58e269990
  status: ACCEPTED
4. Resolving the fracture (second consensus path)...
  tx (resolve_fracture): 0xf1644520859b40cb83ecc3c7665dc43e248db39d2d2385e8d020ae01a13b3233
  status: ACCEPTED
  fracture.status = RESOLVED, resolution = UPHOLD_ORIGINAL
  final vault.state = RECONCILED
```

The `reasoning_summary` there is the model's own words, generated live —
not written by us — and it directly cites the contract-fetched HTTP 200 as
the reason for its confidence level. That's the Gate D fix working on real
consensus, not just in a mocked test.

Deploy itself also reached unanimous validator agreement: 5/5 votes
`AGREE`, `result_name: MAJORITY_AGREE`, `status_name: ACCEPTED`.

## Honest limits

- **No generated/browser-wallet fallback.** Only injected wallets are
  supported in this pass (see "The wallet model" above).
- **`gltest`-framework integration tests did not run to completion in this
  development environment.** `gltest tests/integration/ -v -s --network
  studionet` gets through config loading and contract deploy (a real
  address is returned) but then fails with `Failed to get schema from all
  clients (default, hosted studio, and local)` immediately after —
  reproducible across two attempts, ruling out a one-off network blip.
  `scripts/live-verify.mjs`, using `genlayer-js` directly against the same
  RPC, has no trouble fetching results from the same network, so this looks
  like an issue specific to this version of the `gltest` package's
  schema-fetch fallback chain rather than the contract or the network. The
  test file and config are left in place, written against the real,
  confirmed `gltest` fixture API, for anyone running a different
  environment.
- **No genuine `genvm-lint` run.** The `genvm-linter` PyPI package
  currently installs as an empty placeholder (version `0.0.1`, no actual
  linter code) in this environment. `python3 -m py_compile` was used as a
  syntax check instead, which is strictly weaker than a real GenVM-aware
  lint pass.
- **`UNDETERMINED` handling is implemented and tested** (both consensus
  methods have an explicit `UNDETERMINED`/`INSUFFICIENT_EVIDENCE`
  abstention path, covered in `tests/direct/`), but has not yet been
  observed occurring naturally against live Studio consensus — every live
  run so far has reached `ACCEPTED` with a decisive result.
- **`readVaults()` fetches vaults one at a time** (get count, then one read
  per vault). Fine at current scale; would need batching if the archive
  grows large.

## Redeploying after a contract change

```bash
python3 -m py_compile contracts/EpitaphLegacyProtocol.py   # syntax check
pytest tests/direct/ -v                                     # run first
genlayer network set studionet
genlayer deploy --contract contracts/EpitaphLegacyProtocol.py
```

Then, with the new address:

```bash
node scripts/verify-schema.mjs <newAddress>   # confirm frontend still matches
```

Update the new address **everywhere it's referenced** — `.env.local`, the
Vercel project's environment variables (`vercel env rm/add ... production`,
then a new deploy), and this README's "Deployed contract" section — so no
stale address is left pointing at retired bytecode. `information.md` has
the full history of every redeploy performed on this project and why.
