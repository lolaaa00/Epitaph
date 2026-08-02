# EPITAPH — Decision Record

This is a retroactive but honest account of the idea space considered for
this project and why EPITAPH was built the way it was. It was written after
an audit against the GenLayer Projects submission guidance surfaced that no
such record existed — that gap is acknowledged directly rather than
backfilled with a story that makes it look planned from day one.

## Candidates considered

1. **Legacy Vault / consensus-adjudicated biography (EPITAPH, built)** —
   validators judge submitted evidence and testimony about a person's life
   and reach consensus on a legacy summary, impact score, and preservation
   recommendation. Disputes go through a second consensus round.
2. **Web-fetch-and-judge fact checker** — paste a claim, contract fetches
   the cited page and validators judge truth/falsity. The default "familiar
   non-determinism" pattern the guidance explicitly warns against defaulting
   to. Rejected as a *primary* idea for exactly that reason, but its
   fetch-and-verify mechanism was later folded into EPITAPH itself (see
   "How Gate D was addressed" below) rather than discarded.
3. **Escrowed bounty resolution with staked appeals** — payer deposits GEN,
   validators judge whether submitted work satisfies a bounty description,
   winner is paid automatically. Involves native value and a real
   two-distrusting-parties dynamic (payer vs. claimant). A strong candidate;
   not chosen because it overlaps heavily with existing "trustless escrow"
   GenLayer examples and doesn't showcase a use case beyond what's already
   demonstrated elsewhere in the ecosystem.
4. **Image-evidence insurance claim adjudication** — submit a photo of
   damage, `exec_prompt(images=[...])` judges severity/plausibility against
   a policy, contract pays out from a pooled fund. Genuine value + image
   capability. Not chosen: the domain (insurance) needs regulatory framing
   this project didn't want to take on responsibly for a hackathon scope.
5. **On-chain semantic search over community-submitted definitions**
   (`VecDB`/`knn` embeddings) — deterministic once embedded, so the actual
   consensus surface is thin; mostly indexing, not judgment. Failed Gate C
   (irreducibly semantic) on inspection — retrieval isn't adjudication.
6. **Reputation-staked code review** — reviewers stake GEN, validators judge
   whether a PR-style diff meets stated criteria, stake slashed/rewarded on
   agreement with consensus. Real value + real semantic judgment. Not
   chosen: fetching a diff from a live git host inside consensus adds
   fragility (auth, private repos, arbitrary diff size) disproportionate to
   what a submission needed to prove.
7. **Contested naming/identity attestation for people or organizations** —
   close cousin of candidate 1, but scoped to a single fact ("is this the
   same person") rather than an evolving record. Rejected as too narrow to
   sustain a real UI beyond a single yes/no screen — fails Gate E (would a
   stranger use this twice).
8. **Multi-party contract renegotiation arbiter** — two parties submit
   competing amendments to a prior agreement, validators judge which is more
   consistent with the original terms. Real two-party distrust, real
   judgment. Not chosen over candidate 1 because standing up a believable
   "original agreement" data model added scope without adding a new
   capability compared to what EPITAPH already exercises.

## Capability spread (honest self-audit)

Candidates 2, 4, 5, 6 pull from four different capabilities (web fetch,
images, embeddings, cross-service composition); candidates 3 and 8 involve
native value. **The idea actually chosen (1) does not use images, embeddings,
or native value** — it is fundamentally a comparative-text-judgment idea,
which is the single most common pattern the guidance warns against
defaulting to. This is a real limitation of the final build, not something
the candidate list disguises.

If web access did not exist as a capability at all, the chosen idea would
still have been buildable in a materially weaker form — purely on submitter
testimony with no independent verification — which is precisely the "stable
URL content treated as proof of ownership" failure mode called out in
reviewer feedback on other submissions. That gap is why fetch-based
verification was retrofitted into the two consensus methods rather than left
as a known weakness (see below).

## Gate-by-gate justification for the chosen idea

- **Gate A (counterfactual):** delete GenLayer and a single submitter, or a
  single moderator, decides what a person's legacy record says. Every other
  contributor and every reader has to trust that one party's judgment calls
  on contested, often emotionally loaded claims. That is exactly the
  single-party-must-be-trusted failure mode the gate is checking for.
- **Gate B (two distrusting parties):** the person submitting favorable
  evidence/testimony about someone, and the person opening a Fracture to
  dispute a claim, achievement, or omission. Their interests are directly
  opposed on the specific contested point — one wants the record to say X,
  the other wants it to say not-X or add context.
- **Gate C (irreducibly semantic):** judging whether a set of testimonials
  and records supports a claimed level of "impact," whether a dispute
  constitutes missing context vs. a false claim, and how controversial a
  record should be classified are judgment calls, not something a regex or
  price feed resolves.
- **Gate D (evidence the contract fetches itself):** initially **not**
  satisfied — the first working version treated every `source_ref` as an
  opaque string handed to the model as submitter-asserted text, with no
  independent verification. This was flagged in a self-audit against
  reviewer feedback on other submissions (*"stable URL content is treated as
  proof of ownership... several reviews do not fetch their cited evidence"*)
  and fixed: `request_legacy_inscription` and `resolve_fracture` now fetch
  up to 3 http(s) source references via `gl.nondet.web.get` from inside the
  leader closure, and the prompt explicitly instructs validators to weigh
  contract-fetched confirmation above unverified submitter claims. A failed
  fetch is treated as unverified, never as proof of falsity — non-http(s)
  references (ipfs://, etc.) are labeled as not attempted rather than
  silently ignored.
- **Gate E (would a stranger use this twice):** a memory-preservation record
  is not a one-shot artifact — evidence accumulates, disputes get raised
  months later, and the record can be revised. The same vault is a
  destination people return to, not a single transaction.
- **Gate F (path beyond submission):** the natural extension is community
  moderation for existing legacy/memorial platforms, or a standalone
  public-figure record that outlives any single hosting party — the
  contract, not a company, owns the canonical record.
- **Gate G (latency budget):** the two consensus writes are isolated to
  their own transactions (`request_legacy_inscription`,
  `resolve_fracture`), separate from the fast deterministic writes
  (`create_legacy_vault`, `submit_evidence`, `submit_memory`, `open_fracture`).
  A user filling in a form is never blocked on validator consensus; only the
  explicit "request inscription" / "resolve fracture" actions are, and the
  frontend treats those as long-running transactions rather than instant
  actions.

## What would change if this were re-scoped today

Given the gap identified in the capability-spread self-audit above, a
second iteration should genuinely explore one of the value-bearing
candidates (3 or 8) rather than retrofitting value into candidate 1's shape,
since bolting escrow onto a memory-preservation record would be artificial.
This record intentionally does not pretend otherwise.
