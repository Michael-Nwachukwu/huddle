# Huddle

A full-stack dApp for collaborative workspaces on Hedera Testnet. The repository contains:

-   `client/` — Next.js 15 app with TailwindCSS 4, shadcn/ui, thirdweb SDK, and Hedera integrations
-   `contracts/` — Hardhat 3 (beta) Solidity workspace with deployment scripts for Hedera testnet

---

## Features

-   **Workspaces & Tasks**: Create, view, and manage tasks; task reader contract to fetch on-chain task state
-   **Huddle Channel**: Topic-based chat leveraging Hedera Consensus Service (HCS)
-   **Governance**: Proposal pages to coordinate actions within a workspace
-   **Wallet & Chain Awareness**: Connect with thirdweb; Hedera Testnet indicator
-   **File & Topic Utilities**: Helpers to create HCS topics and Hedera files (example)

---

## Tech Stack

-   **Frontend**: Next.js 15, React 19, TailwindCSS 4, shadcn/ui, Radix UI, TanStack Query & Table
-   **Web3**: thirdweb v5, Hedera SDK, ethers (for ABI/typing interop), Hashio RPC
-   **Contracts**: Solidity 0.8.28, Hardhat 3, OpenZeppelin, mocha + ethers test tooling

---

## Monorepo Layout

```
/ (root)
  README.md
  client/
  contracts/
```

### `client/` key paths

-   `src/app` — Next.js app routes (dashboard, tasks, governance, bot, APIs)
-   `src/components` — UI components including `app-sidebar`, `site-header`, shadcn UI
-   `src/hooks` — custom hooks for Hedera and task flows
-   `src/lib` — blockchain helpers (contracts, topic/file creation)
-   `src/utils/chains.ts` — Hedera chain definitions

### `contracts/` key paths

-   `contracts/` — Solidity sources: `Workspace.sol`, `WorkspaceNft.sol`, `MockUsdt.sol`, `HuddleTaskReader.sol`, `HuddleLib.sol`
-   `scripts/` — deployment scripts for Hedera testnet
-   `hardhat.config.ts` — Hardhat 3 config with Hedera testnet network

---

## Prerequisites

-   Node.js 18+ and npm (or pnpm/yarn/bun)
-   A Hedera Testnet account (operator ID and key)
-   Funded Hedera testnet account for contract deployment

---

## Environment Variables

Create `client/.env.local` with:

```
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_OPERATOR_ID=0.0.xxxxx
NEXT_PUBLIC_OPERATOR_KEY=302e02... (private key)
```

Optionally, for any server-only use within client (if needed), use non-public keys (do not expose in client) and server routes.

Create `contracts/.env` (or export in shell) with:

```
HEDERA_PRIVATE_KEY=302e02... (deployer private key)
SEPOLIA_PRIVATE_KEY=optional_if_using_eth
SEPOLIA_RPC_URL=optional_if_using_eth
```

Notes:

-   The client uses `thirdweb` configured for `hederaTestnet` via `src/utils/chains.ts` and `client.ts`.
-   On the frontend, `site-header` shows “Hedera Testnet” when connected to chain id 296.

---

## Install & Run

From the repo root:

```bash
# install client dependencies
cd client
npm install

# run client (Next.js)
npm run dev
# open http://localhost:3000
```

Contracts (optional, if developing Solidity):

```bash
cd ../contracts
npm install

# compile & test
npx hardhat compile
npx hardhat test | cat
```

---

## Contracts: Build & Deploy (Hedera Testnet)

Hardhat network `testnet` is configured in `hardhat.config.ts` to use Hashio RPC. Be sure `HEDERA_PRIVATE_KEY` is set in your environment.

```bash
cd contracts
npm install

# Deploy USDT mock
npx ts-node scripts/deployMockUsdt.ts | cat

# Deploy Huddle main contract (takes USDT address as ctor)
# Update in script if needed; current example uses: 0x694A10e38D1a7E3b15D6361AdaB4f3Be188b13CA
npx ts-node scripts/deployHuddleContract.ts | cat

# Deploy Task Reader (pass Huddle address in script)
# Current sample uses: 0xEBF42514DeD00D23358706bEB810223744Bc9BD5
npx ts-node scripts/deployHuddleTaskReader.ts | cat
```

Deployment addresses are tracked in `contracts/deployed_addresses.md`.

---

## Frontend: Contract Integration

Contract helpers under `client/src/lib`:

-   `contract.ts` — thirdweb `getContract` for Huddle at `0xEBF4...BD5` on Hedera Testnet
-   `huddle-taskReader-contract.ts` — thirdweb `getContract` for TaskReader at `0x73e0...70D`
-   `createTopic.ts` — create a Hedera Consensus Service topic using operator credentials
-   `createFile.ts` — example for Hedera File Service (currently commented API pattern)

Update addresses as you redeploy, keeping `contracts/deployed_addresses.md` and client libs in sync.

---

## API Routes (client)

-   `app/api/chat/route.ts` — chat streaming/integration (AI SDK based)
-   `app/api/create-topic/route.ts` — wrapper to create HCS topics
-   `app/api/retrieve-file/route.ts` — sample retrieval endpoint
-   `app/api/submit-message/route.ts` — submit chat messages
-   `app/api/upload-file/route.ts` — file upload handler

Each route is implemented as an App Router `route.ts` handler.

---

## Key UI Flows

-   Sidebar navigation (`components/app-sidebar.tsx`) with entries for Dashboard, Huddle, Tasks, Governance, Account
-   Header (`components/site-header.tsx`) reflects current sidebar title and shows chain status & wallet button
-   Tasks pages (`app/dashboard/tasks`) render table/grid views and CRUD dialogs
-   Governance pages (`app/dashboard/governance`) display proposals and detail pages
-   Huddle Channel (`app/dashboard/channel`) integrates topic chat via custom hooks

---

## Common Scripts

Client (`client/package.json`):

```json
{
	"scripts": {
		"dev": "next dev",
		"build": "next build",
		"start": "next start",
		"lint": "eslint"
	}
}
```

Contracts: use `npx hardhat` and `ts-node` to run scripts in `contracts/scripts`.

---

## Development Tips

-   Ensure your wallet is connected to Hedera Testnet; the header will show the network badge
-   Keep contract addresses in `client/src/lib` updated after redeploys
-   For HCS operations, set `NEXT_PUBLIC_OPERATOR_ID` and `NEXT_PUBLIC_OPERATOR_KEY`
-   Use TanStack Query for data fetching and caching in React components

---

## Troubleshooting

-   No network badge in header: verify wallet connection and chain id `296`
-   Contract method failures: check addresses in `client/src/lib/*` and that contracts are deployed and verified
-   Topic creation failing: ensure operator credentials are valid and testnet is reachable

---

## License

MIT
