# EPITAPH — Response to Team Review

**Project:** EPITAPH — GenLayer Legacy Preservation Protocol
**Scope of this document:** a running log of the two rounds of fixes applied
in response to team review — the original `TypeError` crash in the
equivalence-principle consensus logic, and a subsequent, more substantial
fix to how the contract verifies submitted evidence.

---

## 1. Review Feedback (as received)

> The main thing to improve is the contract's equivalence principle logic, which
> currently crashes at runtime due to calling `.get()` on the dictionary returned
> by `prompt_comparative` (causing a `TypeError` on-chain). For a stronger version,
> remove these `.get()` calls so `raw` binds directly to the returned dictionary.

---

## 2. Root Cause

`gl.eq_principle.prompt_comparative(fn, principle)` **returns the agreed consensus
value directly** — in our case, a Python `dict`.

The contract was treating the return value as if it were a wrapper/awaitable object
and calling `.get()` on it:

```python
raw = gl.eq_principle.prompt_comparative(call_validators, principle).get()
```

Because the return value is a plain `dict`, `dict.get()` was being invoked **with no
key argument**. `dict.get()` requires at least one positional argument, so this raises:

```
TypeError: get expected at least 1 argument, got 0
```

This crash occurred **on-chain at runtime**, inside the two non-deterministic
consensus methods, so every real invocation of them failed:

- `request_legacy_inscription` — validators interpret the evidence packet and agree
  on a bounded legacy record.
- `resolve_fracture` — validators adjudicate a dispute and agree on a resolution.

Both are the core "intelligence" of the protocol, so the bug blocked the two most
important flows.

---

## 3. Fix Applied

Removed the erroneous `.get()` call in both methods so `raw` binds directly to the
dictionary returned by `prompt_comparative`.

### Before
```python
raw = gl.eq_principle.prompt_comparative(call_validators, principle).get()
if isinstance(raw, str):
    raw = json.loads(raw)
```

### After
```python
raw = gl.eq_principle.prompt_comparative(call_validators, principle)
if isinstance(raw, str):
    raw = json.loads(raw)
```

The subsequent `if isinstance(raw, str): raw = json.loads(raw)` guard is retained.
It safely handles the case where the consensus value comes back as a JSON string
rather than an already-parsed object, so the downstream handlers
(`_store_inscription_result` and `_apply_fracture_resolution`) receive a `dict`
exactly as before. No other logic changed.

### Locations
| Method | File / Line |
| --- | --- |
| `request_legacy_inscription` | `contracts/EpitaphLegacyProtocol.py:634` |
| `resolve_fracture` | `contracts/EpitaphLegacyProtocol.py:821` |

(Line numbers as of the first fix. Both methods have since moved and grown —
see §8 — but the same fix remains in place.)

---

## 4. Verification (first fix)

- `python3 -m py_compile contracts/EpitaphLegacyProtocol.py` → passes (syntax clean).
- Confirmed via `grep` that **no** `.get()` call remained on any `prompt_comparative`
  result.

---

## 5. First Redeployment — Completed

The corrected contract was redeployed to GenLayer Studio (chain 61999):

| | |
| --- | --- |
| **New contract address (at the time)** | `0x718383c99e06b411a08FFffAdF5429477477fA5B` — **retired, see §8** |
| **Previous (buggy) address** | `0x842d0bF4154053FE30fe330d3E1ffaf5eF7A8819` — retired |
| **Network** | GenLayer StudioNet, chain ID 61999 |
| **RPC** | `https://studio.genlayer.com/api` |
| **Live frontend** | https://epitaph-two.vercel.app |

Post-redeploy verification:

- A live `read_contract` call (`get_vault_count`) against the new address via
  genlayer-js succeeded, confirming the contract was deployed and responding.
- **Deployed source pulled directly from each address via `client.getContractCode()`
  and diffed for the bug pattern:**

  | Address | Deployed source length | Contains `.get()` bug |
  | --- | --- | --- |
  | `0x842d...8819` (old, retired) | 37,250 chars | **Yes** — bug still present in the retired deployment |
  | `0x718383...fA5B` (retired, see §8) | 37,238 chars | **No** — both `prompt_comparative` call sites confirmed clean on-chain |

- Full write-path test executed live against that address: `create_legacy_vault`
  → `request_legacy_inscription` (consensus produced `PRESERVE_WITH_CONTEXT`,
  impact 48, confidence 34, no `TypeError`) → `open_fracture` →
  `resolve_fracture` (consensus produced `ADD_COUNTER_CONTEXT`, confidence
  correctly adjusted, vault reached `RECONCILED`, no `TypeError`). Both
  non-deterministic consensus flows confirmed working end-to-end on-chain.
- The Vercel production environment variable
  `NEXT_PUBLIC_EPITAPH_CONTRACT_ADDRESS`, `.env.local`, and the README were
  all updated to that address at the time.
- **`README.md` had briefly still listed the old, retired address in three
  places** (live-deployment section, `.env.local` example, redeploy
  instructions) despite the frontend and Vercel already pointing at the new
  one. This was corrected, and the redeploy instructions were updated to
  explicitly call out updating `.env.local`, Vercel, and the README together
  so no stale address is left pointing at retired bytecode.

---

## 6. Notes on the Equivalence Principle (unchanged, for context)

The two consensus methods intentionally use `gl.eq_principle.prompt_comparative`
with a natural-language `principle`, rather than strict JSON equality, so that
validators agree on the **essential fields** (recommendation, controversy band,
score ranges, resolution category, effect direction) while tolerating differences
in wording and phrasing. That design was not affected by the `.get()` fix in §3 —
only the incorrect `.get()` invocation on the return value was removed. It was
not affected by the Gate D fetch fix in §8 either — the equivalence principle
prose itself is unchanged; only the evidence fed into the prompt is now partly
contract-verified.

---

## 7. Full Repo Audit (post-rejection)

Following the rejection, a complete re-audit was performed against the
GenLayer builder documentation and the live deployed contract, rather than
relying on prior context. Findings:

- **Deployed bytecode verified byte-for-byte against local source.** Pulled
  the contract source directly from the then-live address via
  `client.getContractCode()` and diffed it against
  `contracts/EpitaphLegacyProtocol.py` — exact match, confirming the deployed
  contract was genuinely the corrected version and not stale.
- **No other bare `.get()` calls existed anywhere in the contract.** Every
  `.get()` invocation in the file (on `TreeMap`s and on the LLM-returned
  `dict`) takes an explicit key/default argument.
- **Found and fixed a second, related bug in the frontend** (not the
  contract): `lib/contract.ts`'s write-failure detection checked
  `receipt.statusName` / `receipt.txExecutionResultName` — fields that do
  not exist on the real GenLayer transaction receipt. The actual receipt
  uses snake_case (`status_name`, `result_name`), and — critically — a
  contract call that raises an exception can still show a top-level
  `status_name` of `ACCEPTED` and `result_name` of `MAJORITY_AGREE` (since
  validators unanimously agreeing "this call errors" is itself a valid
  consensus outcome). The real signal is nested at
  `consensus_data.leader_receipt[].execution_result`, confirmed
  empirically on live Studio transactions: `"SUCCESS"` for a working call,
  `"ERROR"` (with a Python traceback in `genvm_result.stderr`) for one that
  raises. This means that if a contract-level exception like the original
  `.get()` bug had recurred, **the frontend would have silently reported
  success and shown no error to the user.** Fixed in
  [lib/contract.ts](lib/contract.ts) to read the correct fields and surface
  the actual on-chain error message.
- **Verified the fix against real transactions on the live contract**, not
  just theoretically: forced a real on-chain error (calling `submit_memory`
  against a nonexistent vault) and confirmed the corrected detection logic
  flags it as failed with the traceback surfaced; then ran a real
  successful `create_legacy_vault` and confirmed it is not incorrectly
  flagged. Both cases passed.
- **Cross-checked every contract dataclass field against the frontend
  formatters** (`lib/formatters.ts`) and every read/write method name
  against `lib/constants.ts`'s `CONTRACT_METHODS` map — all field names and
  method signatures matched exactly.
- `npm run lint` and `npm run build` both clean after all fixes.

---

## 8. Second Redeploy — Gate D Evidence-Verification Fix

A subsequent audit against GenLayer's project submission guidance surfaced
a separate, more substantial issue: the contract treated every submitted
`source_ref` URL as trustworthy without ever fetching it — the model only
ever saw the submitter's *claim* about what a source contained, never the
source itself. This is the "stable URL content treated as proof of
ownership" failure pattern GenLayer reviewers have flagged on other
submissions.

**Fixed** by adding real contract-side fetching:

- Both `request_legacy_inscription` and `resolve_fracture` now call
  `gl.nondet.web.get(url)` on up to 3 http(s) `source_ref` values, from
  inside the leader closure (required, since it's itself a non-deterministic
  operation subject to the same lexical-nesting rule as `exec_prompt`).
- The prompt explicitly instructs validators to weigh a successful
  contract-fetched confirmation above an identical but unverified submitter
  claim, and to treat a failed fetch as *unverified*, never as proof of
  falsity.
- Non-http(s) references (e.g. `ipfs://`) are labeled as not attempted
  rather than silently ignored.

Two smaller hardening fixes went in alongside it:

- All `raise ValueError(...)` call sites converted to
  `raise gl.vm.UserError(...)`, matching the documented GenLayer pattern
  (verified against the real SDK docs, not guessed).
- Added `_parse_model_json()`: strips markdown fences and recovers the
  outermost `{...}` before parsing model output, so a validator that
  ignores the "no markdown fences" instruction doesn't crash the whole
  consensus round with an unhandled `JSONDecodeError`.

**Current deployed address:** `0x1320efcEed8c325E432d24CA40A0835B742e87af`
(supersedes `0x718383c99e06b411a08FFffAdF5429477477fA5B`, which supersedes
`0x842d0bF4154053FE30fe330d3E1ffaf5eF7A8819` — both retired).

**Verification performed, in order:**

1. `python3 -m py_compile` — syntax clean.
2. 33 direct-mode tests written against `gltest`'s real (not mocked-out)
   Foundry-style simulator fixtures (`direct_vm`, `mock_llm`, `mock_web`,
   `expect_revert`) — all 33 passing, actually executed, including cases
   for fenced/commentary-wrapped model output, successful fetch, and failed
   fetch. See `tests/direct/test_epitaph_protocol.py`.
3. Deployed via `genlayer deploy` — 5/5 validators voted `AGREE`,
   `result_name: MAJORITY_AGREE`, `status_name: ACCEPTED`.
4. `scripts/verify-schema.mjs` against the new address — all 21 frontend
   call sites (7 writes, 14 reads) match the live schema exactly.
5. `scripts/live-verify.mjs` — a real, executed, unmocked end-to-end run
   against the new address on Studio: created a vault with a genuinely
   fetchable GitHub-hosted `source_ref`, requested an inscription, and the
   model's own returned `reasoning_summary` explicitly cited *"the contract
   directly fetched the cited GitHub README with HTTP 200"* as the reason
   for its confidence — proving the fix works on real consensus, not only
   in a mocked test. Then opened and resolved a fracture against that
   inscription (the second consensus path) — resolved `UPHOLD_ORIGINAL`,
   vault reached `RECONCILED`. Full transcript in `README.md`.
6. `.env.local`, the Vercel production environment variable, and the
   README's "Deployed contract" section were all updated to the new
   address; a fresh production deployment was published and confirmed to
   serve the new address with zero references to either retired address.

---

## 9. Third Redeploy — Deterministic Corroboration Gating

The project scored 340 points, with this feedback:

> The main thing holding this back is that validators permanently judge
> user-submitted source references without fetching or authenticating them.
> For a stronger version, retrieve supported sources during consensus and
> reserve high confidence or sealing for corroborated evidence.

This is a sharper version of the same concern §8 addressed: §8 made the
contract *fetch* source references, but only fed the result into the
prompt as context — the model was *asked* to weigh corroboration more
heavily, with nothing in the contract actually enforcing it. A model can
ignore that instruction. This round makes corroboration **load-bearing in
contract code**, not merely advisory in a prompt.

**What changed:**

- `gl.nondet.web.get` results are now counted (HTTP 2xx = corroborated)
  *inside* the leader closure, so the count is itself subject to the same
  equivalence-principle consensus as everything else (validators must
  agree on "zero vs. at least one corroborated source," tolerating
  transient per-validator fetch flakiness without treating it as
  disagreement).
- Added `corroborated_source_count: u32` to `LegacyInscription`.
- **Deterministic, unconditional enforcement** after consensus resolves:
  - `memory_confidence` is capped at `MAX_UNCORROBORATED_CONFIDENCE` (40)
    whenever nothing was corroborated, regardless of the model's returned
    value.
  - An unqualified `PRESERVE` recommendation is downgraded to
    `PRESERVE_WITH_CONTEXT` under the same condition.
  - `seal_vault` now reverts outright unless the vault's latest inscription
    has `corroborated_source_count > 0` — a vault built entirely on
    submitter-asserted, unverified claims can never be made permanent.
- Both consensus flows are covered independently: `resolve_fracture`
  computes and applies its own `corroborated_source_count`, so a dispute
  resolved without successfully re-fetching anything is capped the same
  way a fresh inscription would be.

**Current deployed address:** `0xB2F4686a3B637E817833369a299b748D8920bE68`
(supersedes `0x1320efcEed8c325E432d24CA40A0835B742e87af`, which supersedes
`0x718383c99e06b411a08FFffAdF5429477477fA5B`, which supersedes
`0x842d0bF4154053FE30fe330d3E1ffaf5eF7A8819` — all three retired).

**Verification performed, in order:**

1. `python3 -m py_compile` — syntax clean.
2. Test suite grown from 33 to 38 direct-mode tests: the 5 new tests
   explicitly prove the gate — zero-corroboration clamps confidence and
   downgrades `PRESERVE`; corroborated evidence does not clamp; `seal_vault`
   reverts without corroboration; `seal_vault` succeeds with it; a fracture
   resolution round with zero corroboration clamps the vault's resulting
   confidence even when the model's own `confidence_delta` would have
   pushed it higher. All 38 passing, actually executed
   (`tests/direct/test_epitaph_protocol.py`).
3. Deployed via `genlayer deploy` — 5/5 validators voted `AGREE`,
   `result_name: MAJORITY_AGREE`, `status_name: ACCEPTED`.
4. `scripts/verify-schema.mjs` against the new address — all 21 frontend
   call sites match the live schema exactly.
5. `scripts/live-verify.mjs` extended with a **live negative control**,
   executed against real Studio consensus (not mocked): a corroborated
   vault sealed successfully (`corroborated_source_count = 1`); a second,
   deliberately uncorroborated vault (an unfetchable `.invalid` domain)
   reached `corroborated_source_count = 0`, and its `seal_vault`
   transaction was **rejected on-chain** — `execution_result != SUCCESS` —
   independent of anything the model returned. Full transcript in
   `README.md`.
6. `.env.local`, the Vercel production environment variable, and the
   README's "Deployed contract" section and full results transcript were
   all updated to the new address; a fresh production deployment was
   published and confirmed to serve the new address with zero references
   to any of the three retired addresses.

---

Full technical writeup, including the quoted equivalence-principle prose
and the architecture rationale, is in `README.md`. The idea-selection
rationale and an honest self-audit of what this project does and doesn't
cover across GenLayer's capability surface is in `DECISION_RECORD.md`.
