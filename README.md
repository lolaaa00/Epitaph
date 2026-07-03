# EPITAPH
(https://epitaph-two.vercel.app/)

**The archive that lets memory be judged, challenged, and preserved by consensus.**

EPITAPH is a GenLayer-native legacy preservation protocol. Users open a Legacy Vault for a person, submit evidence and community memories, and request a GenLayer Intelligent Contract to run real non-deterministic validator consensus that produces a legacy summary, impact score, memory confidence, controversy level, and preservation recommendation. Disputes ("Fractures") can be raised and resolved through a second consensus flow.

Frontend and GenLayer Intelligent Contract only — no backend, no database. The contract is the canonical memory ledger; the frontend reads and writes directly to it.

## Live deployment

- Contract address: `0x842d0bF4154053FE30fe330d3E1ffaf5eF7A8819`
- Network: GenLayer Studio Network (chain `61999`)
- Explorer: https://explorer-studio.genlayer.com/address/0x842d0bF4154053FE30fe330d3E1ffaf5eF7A8819

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- `genlayer-js` for contract reads/writes and wallet connection
- `contracts/EpitaphLegacyProtocol.py` — the GenLayer Intelligent Contract (Python), using `gl.nondet.exec_prompt` + `gl.eq_principle.prompt_comparative` for both consensus flows (`request_legacy_inscription`, `resolve_fracture`)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Connect an injected wallet (e.g. MetaMask) and make sure it's on GenLayer Studio Network — the app will prompt to add/switch the chain automatically on first connect.

## Environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_EPITAPH_CONTRACT_ADDRESS=0x842d0bF4154053FE30fe330d3E1ffaf5eF7A8819
```

This is the only environment variable the app requires. It's public (`NEXT_PUBLIC_*`) since it's just the deployed contract address, not a secret.

## Testing the app

1. `/vaults/new` — open a Legacy Vault with a person's name, life period, identity line, initial claim, and one piece of initial evidence.
2. `/vaults/[id]/archive` — submit additional evidence (writings, achievements, testimonials, controversies, counter-context, etc.)
3. `/vaults/[id]/memories` — submit community memory traces.
4. `/vaults/[id]/consensus` — request a Legacy Inscription; this triggers real GenLayer validator consensus (typically 30s–2min) and produces the legacy summary, impact score, memory confidence, controversy level, and preservation recommendation.
5. `/vaults/[id]/fractures/new` — open a dispute against the inscription or a piece of evidence, then resolve it from `/vaults/[id]/fractures` to trigger the second consensus flow.

## Contract

`contracts/EpitaphLegacyProtocol.py` owns all protocol state: `LegacyVault`, `EvidenceShard`, `MemoryTrace`, `LegacyInscription`, `FractureRecord`, `ProtocolEvent`. All user-submitted text is treated as evidence, not instruction — both consensus prompts explicitly instruct validators to ignore embedded instructions, and the contract rejects submissions containing obvious verdict-injection phrases (`_reject_injection`).

To redeploy after a contract change:

```bash
npx genlayer network set studionet
npx genlayer deploy --contract contracts/EpitaphLegacyProtocol.py
```

Then update `NEXT_PUBLIC_EPITAPH_CONTRACT_ADDRESS` with the new address.
