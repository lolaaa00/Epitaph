# EPITAPH — Response to Team Review

**Project:** EPITAPH — GenLayer Legacy Preservation Protocol
**Date:** 2026-07-18
**Scope of this document:** Fix applied in response to the post-submission review of the Intelligent Contract's equivalence-principle consensus logic.

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

---

## 4. Verification

- `python3 -m py_compile contracts/EpitaphLegacyProtocol.py` → passes (syntax clean).
- Confirmed via `grep` that **no** `.get()` call remains on any `prompt_comparative`
  result:
  ```
  634:  raw = gl.eq_principle.prompt_comparative(call_validators, principle)
  821:  raw = gl.eq_principle.prompt_comparative(call_validators, principle)
  ```

---

## 5. Redeployment — Completed

The corrected contract has been **redeployed** to GenLayer Studio (chain 61999):

| | |
| --- | --- |
| **New contract address** | `0x718383c99e06b411a08FFffAdF5429477477fA5B` |
| **Previous (buggy) address** | `0x842d0bF4154053FE30fe330d3E1ffaf5eF7A8819` — retired |
| **Network** | GenLayer StudioNet, chain ID 61999 |
| **RPC** | `https://studio.genlayer.com/api` |
| **Live frontend** | https://epitaph-two.vercel.app |

Post-redeploy verification:

- A live `read_contract` call (`get_vault_count`) against the new address via
  genlayer-js succeeds, confirming the contract is deployed and responding.
- **Deployed source pulled directly from each address via `client.getContractCode()`
  and diffed for the bug pattern:**

  | Address | Deployed source length | Contains `.get()` bug |
  | --- | --- | --- |
  | `0x842d...8819` (old, retired) | 37,250 chars | **Yes** — bug still present in the retired deployment |
  | `0x718383...fA5B` (current) | 37,238 chars | **No** — both `prompt_comparative` call sites confirmed clean on-chain |

- Full write-path test executed live against the new address: `create_legacy_vault`
  → `request_legacy_inscription` (consensus produced `PRESERVE_WITH_CONTEXT`,
  impact 48, confidence 34, no `TypeError`) → `open_fracture` →
  `resolve_fracture` (consensus produced `ADD_COUNTER_CONTEXT`, confidence
  correctly adjusted, vault reached `RECONCILED`, no `TypeError`). Both
  non-deterministic consensus flows confirmed working end-to-end on-chain.
- The Vercel production environment variable
  `NEXT_PUBLIC_EPITAPH_CONTRACT_ADDRESS` was updated to the new address and a
  fresh production deployment was published; the new address is confirmed
  present in the served JS bundle, with no references to the old address.
- **`README.md` previously still listed the old, retired address in three
  places** (live-deployment section, `.env.local` example, redeploy
  instructions) despite the frontend and Vercel already pointing at the new
  one. This has been corrected — every address reference in the repo now
  points at `0x718383...fA5B`, and the redeploy instructions now explicitly
  call out updating `.env.local`, Vercel, and the README together so no stale
  address is left pointing at retired bytecode.

## 7. Full Repo Audit (post-rejection)

Following the rejection, a complete re-audit was performed against the
GenLayer builder documentation and the live deployed contract, rather than
relying on prior context. Findings:

- **Deployed bytecode verified byte-for-byte against local source.** Pulled
  the contract source directly from `0x718383...fA5B` via
  `client.getContractCode()` and diffed it against
  `contracts/EpitaphLegacyProtocol.py` — exact match (37,238 chars both
  sides), confirming the deployed contract is genuinely the corrected
  version and not stale.
- **No other bare `.get()` calls exist anywhere in the contract.** Every
  `.get()` invocation in the file (on `TreeMap`s and on the LLM-returned
  `dict`) now takes an explicit key/default argument.
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
  just theoretically: forced a real on-chain `ValueError` (calling
  `submit_memory` against a nonexistent vault) and confirmed the corrected
  detection logic flags it as failed with the traceback surfaced; then ran
  a real successful `create_legacy_vault` and confirmed it is not
  incorrectly flagged. Both cases passed.
- **Cross-checked every contract dataclass field against the frontend
  formatters** (`lib/formatters.ts`) and every read/write method name
  against `lib/constants.ts`'s `CONTRACT_METHODS` map — all field names and
  method signatures match exactly.
- `npm run lint` and `npm run build` both clean after all fixes.

With the corrected bytecode on-chain, `request_legacy_inscription` and
`resolve_fracture` execute their equivalence-principle consensus without
crashing.

---

## 6. Notes on the Equivalence Principle (unchanged, for context)

The two consensus methods intentionally use `gl.eq_principle.prompt_comparative`
with a natural-language `principle`, rather than strict JSON equality, so that
validators agree on the **essential fields** (recommendation, controversy band,
score ranges, resolution category, effect direction) while tolerating differences
in wording and phrasing. That design was not affected by this fix — only the
incorrect `.get()` invocation on the return value was removed.
