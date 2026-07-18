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

## 5. Action Required — Redeploy

This is a change to the **contract source**, so it must be **redeployed** to take
effect on-chain. The previously deployed address still holds the old (buggy)
bytecode and will continue to raise the `TypeError` until replaced.

After redeploying the corrected contract:

1. Copy the new deployed contract address.
2. Update `NEXT_PUBLIC_EPITAPH_CONTRACT_ADDRESS` in `.env.local` with that address.
3. Restart the dev server so the frontend points at the corrected deployment.

Once redeployed, `request_legacy_inscription` and `resolve_fracture` execute their
equivalence-principle consensus without crashing.

---

## 6. Notes on the Equivalence Principle (unchanged, for context)

The two consensus methods intentionally use `gl.eq_principle.prompt_comparative`
with a natural-language `principle`, rather than strict JSON equality, so that
validators agree on the **essential fields** (recommendation, controversy band,
score ranges, resolution category, effect direction) while tolerating differences
in wording and phrasing. That design was not affected by this fix — only the
incorrect `.get()` invocation on the return value was removed.
