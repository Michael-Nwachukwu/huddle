# Huddle

A decentralized workspace management platform built on Hedera Testnet that enables teams to collaborate, manage tasks with crypto rewards, communicate via immutable chat, and make collective decisions through on-chain governance.

---

### Links

[Hedera Certification Team Member 1](https://drive.google.com/file/d/1TaOrEKaT7wbtQDFtiawi4xjvT9taIOuN/view?usp=sharing)
[Hedera Certification Team Member 2](https://drive.google.com/file/d/1uPVMWZ4Bf8Y2lKNlzXnaJEkEi2Ad0mHu/view?usp=drive_link)

[Pitch Deck](https://www.canva.com/design/DAG0TbIQoqk/ZFFGoBZS3KTn2TJsPTqQ1w/view?utm_content=DAG0TbIQoqk&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h0df5791317)

Account ID - 0.0.6873100
OPERATOR_KEY= 3030020100300706052b8104000a042204206adbf7e3a424412f101d784936dae6d09014a9708fb5906e36deeac78ffec7bd


## Table of Contents

- [Hedera Integration Summary](#hedera-integration-summary)
- [Architecture Diagram](#architecture-diagram)
- [Deployed Hedera IDs](#deployed-hedera-ids)
- [Setup & Installation](#setup--installation)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Economic Model](#economic-model)
- [Development & Testing](#development--testing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Hedera Integration Summary

Huddle leverages three core Hedera services to provide a fully decentralized, cost-efficient, and scalable collaboration platform optimized for global teams.

### 1. Hedera Smart Contract Service (HSCS)

**Why We Chose HSCS:**
We selected Hedera's EVM-compatible smart contract service for its unique combination of low, predictable gas costs and instant finality (3-5 seconds). Unlike Ethereum where gas spikes can make micro-transactions prohibitively expensive, Hedera's fixed fee structure (~$0.05-0.30 USD per contract call) enables our platform to offer small task rewards (as low as $1-5 USDT) without fees consuming the reward pool. This is critical for emerging markets and distributed teams where operational cost certainty drives adoption.

**Implementation Details:**

- **Main Contract:** [Workspace.sol](contracts/contracts/Workspace.sol) (1,217 lines)
  - ERC721-based workspace membership via dynamically created NFT contracts
  - Task creation, assignment, and reward distribution with 2.5% platform fee
  - Governance proposals with NFT-weighted voting
  - Multi-token support (native HBAR and ERC20/USDT)

- **Task Reader Contract:** [HuddleTaskReader.sol](contracts/contracts/HuddleTaskReader.sol) (421 lines)
  - Gas-optimized read operations with pagination (max 50 tasks per query)
  - Prevents "stack too deep" errors via separate contract architecture
  - Supports filtering by workspace, assignee, and task state

**Transaction Types Executed:**

- `createWorkspace()` - Deploys workspace-specific NFT contract, initializes governance
- `createTask()` - Creates tasks with optional crypto rewards, deducts platform fee
- `claim()` - Allows task assignees to claim rewards with ReentrancyGuard protection
- `createProposal()` - Initiates 15-day governance proposals
- `voteOnProposal()` - Weighted voting based on NFT balance
- `joinWorkspace()` - Mints membership NFT to new members
- `approve()` (ERC20) - Token spending approval for USDT rewards
- `markAs()` - Updates task status (active → inProgress → completed)

<!-- **Economic Justification:**
Hedera's ~10,000 TPS throughput and sub-$0.10 transaction costs enable us to support hundreds of simultaneous workspace operations without network congestion or unpredictable costs. For a platform targeting distributed teams in Africa, Latin America, and Southeast Asia, this means users can participate in governance and claim rewards as low as $1 without losing 30-50% to gas fees (common on Ethereum L1). The ABFT consensus also ensures task reward claims are finalized instantly, preventing double-spending without 12+ block confirmation delays. -->

---

### 2. Hedera Consensus Service (HCS)

**Why We Chose HCS:**
We selected HCS for immutable, decentralized chat because its $0.0001 per message cost is 1000x cheaper than storing messages in smart contract storage (~$0.10+ per message on Ethereum). For a collaboration platform where teams may exchange hundreds of messages daily, HCS provides cryptographically verifiable message ordering and immutability at a fraction of traditional blockchain costs. The ability to create unlimited topics enables private channels per workspace and per task without cost barriers.

**Implementation Details:**

**Topic Creation:**
- [createTopic.ts](client/src/lib/createTopic.ts) - Client-side topic creation utility
- [create-topic/route.ts](client/src/app/api/create-topic/route.ts) - API endpoint for topic initialization
- Uses `TopicCreateTransaction` with descriptive memos
- Automatically creates topics for each workspace and task

**Message Operations:**
- [submit-message/route.ts](client/src/app/api/submit-message/route.ts) - Message submission endpoint
- Uses `TopicMessageSubmitTransaction` with 1024-byte message limit
- Returns transaction ID and sequence number for tracking

**Message Retrieval:**
- [useTopicMessages.ts](client/src/hooks/useTopicMessages.ts) (320 lines) - Custom React hook
- Fetches messages from Hedera Mirror Node REST API
- Smart caching (30-second timeout) + auto-refresh (10-second intervals)
- Base64 message decoding and pagination support
- Endpoint: `https://testnet.mirrornode.hedera.com/api/v1/topics/{topicId}/messages`

**Smart Contract Integration:**
- Workspaces store `topicId` field ([Workspace.sol:120](contracts/contracts/Workspace.sol#L120))
- Tasks store `topicId` field for per-task discussions ([Workspace.sol:140](contracts/contracts/Workspace.sol#L140))
- Topic IDs passed during workspace/task creation and stored on-chain

**Transaction Types Executed:**

- `TopicCreateTransaction` - Creates new HCS topic with memo
- `TopicMessageSubmitTransaction` - Submits UTF-8 messages (max 1KB)

<!-- **Economic Justification:**
At $0.0001 per message, a team exchanging 1,000 messages monthly pays just $0.10—versus $100+ for on-chain storage. This 1000x cost reduction makes real-time collaboration economically viable. HCS's fair ordering (not "first-to-pay" like Ethereum mempools) ensures all participants see messages in the same sequence regardless of network conditions, critical for distributed teams across multiple continents. The immutability also provides audit trails for compliance-heavy industries (legal, healthcare, finance) without enterprise database costs. -->

---

### 3. Hedera File Service (HFS)

**Why We Chose HFS:**
We chose HFS for task attachments because it provides cryptographically verifiable, permanent file storage at ~$0.05 per KB—far cheaper than IPFS+Filecoin pinning services ($1-5/month per file) or centralized CDNs. For teams sharing design files, contracts, or code snippets, HFS ensures files remain accessible indefinitely without ongoing subscription costs. The ED25519 key-based access control also enables fine-grained permissions without smart contract complexity.

**Implementation Details:**

**File Upload:**
- [upload-file/route.ts](client/src/app/api/upload-file/route.ts) - Chunked file upload endpoint
- Uses `FileCreateTransaction` for first 1KB chunk
- Uses `FileAppendTransaction` for subsequent chunks
- Generates ED25519 key pair for file access control
- Max transaction fee: 2 HBAR per operation
- Returns fileId, private key, and public key

**File Retrieval:**
- [retrieve-file/route.ts](client/src/app/api/retrieve-file/route.ts) - File contents query endpoint
- Uses `FileContentsQuery` with fileId
- Decodes and returns file contents as UTF-8

**Smart Contract Integration:**
- Tasks store `fileId` field ([Workspace.sol:141](contracts/contracts/Workspace.sol#L141))
- File IDs passed during task creation and stored on-chain
- Links task metadata to immutable file storage

**Transaction Types Executed:**

- `FileCreateTransaction` - Creates file with initial contents (1KB max)
- `FileAppendTransaction` - Appends additional chunks to file
- `FileContentsQuery` - Retrieves file contents by fileId

<!-- **Economic Justification:**
HFS provides one-time payment model (~$0.05/KB) versus recurring monthly costs with IPFS gateways or AWS S3. For a 100KB design file, HFS costs $5 once—versus $60/year with IPFS pinning services. This aligns with our target users (freelancers, small teams) who prefer predictable upfront costs over recurring subscriptions. The native Hedera integration also eliminates IPFS gateway downtime issues and CID resolution delays, providing sub-second file retrieval via Mirror Nodes. -->

---

### 4. Hedera Mirror Node Integration

**Why We Use Mirror Nodes:**
Mirror Nodes provide REST API access to Hedera network data without running a consensus node. This enables efficient querying of historical transactions, account balances, and HCS messages without on-chain gas costs.

**Implementation Details:**

**Account Information:**
- [use-hedera-account.tsx](client/src/hooks/use-hedera-account.tsx) - Account data fetching hook
- Endpoint: `https://testnet.mirrornode.hedera.com/api/v1/accounts/{address}`
- Returns: Hedera account ID, HBAR balance, EVM address, staking rewards

**Bulk Account Fetching:**
- [use-bulk-account-fetcher.ts](client/src/hooks/use-bulk-account-fetcher.ts) - Parallel account queries
- Maps Hedera account IDs to EVM addresses for chat participants
- Caches results to reduce API calls

**Economic Justification:**
Mirror Node queries are free, enabling rich user experiences (chat participant lists, balance displays, transaction history) without gas costs. This allows Huddle to provide Etherscan-like features (transaction tracking, account exploration) at zero cost, removing barriers for users unfamiliar with blockchain explorers.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE (Frontend)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  Dashboard   │  │    Tasks     │  │  Governance  │  │ HCS Channel  ││
│  │  (Next.js)   │  │  (TanStack)  │  │   (Voting)   │  │    (Chat)    ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘│
│         │                 │                  │                  │        │
│         └─────────────────┴──────────────────┴──────────────────┘        │
│                                     │                                    │
│                          ┌──────────▼──────────┐                        │
│                          │   thirdweb SDK v5   │                        │
│                          │  (Contract Client)  │                        │
│                          └──────────┬──────────┘                        │
└─────────────────────────────────────┼───────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
         ┌──────────▼──────────┐           ┌───────────▼───────────┐
         │   API Routes        │           │   Hedera SDK          │
         │  (Next.js Server)   │           │  (@hashgraph/sdk)     │
         └──────────┬──────────┘           └───────────┬───────────┘
                    │                                   │
        ┌───────────┴───────────┬───────────────────────┴────────┐
        │                       │                                 │
        │ /api/create-topic     │ /api/submit-message             │
        │ /api/upload-file      │ /api/retrieve-file              │
        │ /api/chat             │                                 │
        └───────────┬───────────┴───────────────────────┬─────────┘
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      │
                                      │ HTTPS (Hashio RPC)
                                      │
┌─────────────────────────────────────▼───────────────────────────────────┐
│                         HEDERA TESTNET (Network Layer)                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Smart Contract Service (EVM)                    │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │ │
│  │  │ Huddle Contract  │  │ TaskReader      │  │ WorkspaceNFT    │ │ │
│  │  │ 0xEBF4...BD5     │  │ 0x73e0...70D    │  │ (Dynamic)       │ │ │
│  │  │ - Workspaces     │  │ - Pagination    │  │ - ERC721 Tokens │ │ │
│  │  │ - Tasks          │  │ - Filtering     │  │ - Membership    │ │ │
│  │  │ - Governance     │  │ - Read Ops      │  │                 │ │ │
│  │  │ - Rewards        │  │                 │  │                 │ │ │
│  │  └──────────────────┘  └──────────────────┘  └─────────────────┘ │ │
│  │                                                                    │ │
│  │  ┌──────────────────┐                                             │ │
│  │  │ MockUsdt (ERC20) │                                             │ │
│  │  │ 0x694A...13CA    │                                             │ │
│  │  │ - Test Token     │                                             │ │
│  │  └──────────────────┘                                             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              Hedera Consensus Service (HCS)                        │ │
│  │  - Workspace Topics (chat channels)                                │ │
│  │  - Task Topics (per-task discussions)                              │ │
│  │  - $0.0001/message                                                 │ │
│  │  - Immutable message ordering                                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              Hedera File Service (HFS)                             │ │
│  │  - Task attachments (documents, images, code)                      │ │
│  │  - ~$0.05/KB one-time cost                                         │ │
│  │  - ED25519 access control                                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                                   │ Indexing & Archival
                                   │
                    ┌──────────────▼──────────────┐
                    │   Hedera Mirror Nodes       │
                    │  (REST API & Data Query)    │
                    │                             │
                    │  - HCS message history      │
                    │  - Account balances         │
                    │  - Transaction records      │
                    │  - Smart contract events    │
                    └──────────────┬──────────────┘
                                   │
                                   │ HTTPS (JSON API)
                                   │
                ┌──────────────────┴──────────────────┐
                │                                     │
     ┌──────────▼──────────┐           ┌─────────────▼──────────┐
     │ useTopicMessages    │           │ use-hedera-account     │
     │ (React Hook)        │           │ (React Hook)           │
     │ - Message polling   │           │ - Balance fetching     │
     │ - 30s caching       │           │ - Account ID mapping   │
     └─────────────────────┘           └────────────────────────┘
```

### Data Flow Explanation

1. **User Actions** → Frontend components (Dashboard, Tasks, Governance, Channel)
2. **Contract Interactions** → thirdweb SDK formats transactions → Hashio RPC → Hedera Smart Contracts
3. **HCS Operations** → Next.js API routes → Hedera SDK → HCS topics → Mirror Node indexing
4. **HFS Operations** → File upload API → Chunked FileAppend transactions → HFS storage
5. **Data Queries** → React hooks → Mirror Node REST API → Historical data retrieval
6. **Event Flow** → Smart contract events → Mirror Node → Frontend polling/refresh

---

## Deployed Hedera IDs

All deployments are on **Hedera Testnet** (Chain ID: 296).

### Smart Contracts (EVM Addresses)

| Contract | Address | Purpose |
|----------|---------|---------|
| **Huddle (Main)** | `0xEBF42514DeD00D23358706bEB810223744Bc9BD5` - `0.0.6894057` | Core workspace, task, and governance logic |
| **HuddleTaskReader** | `0x73e010CB522fFE3A26BA24276B998C25C8Cc970D` - `0.0.6904235` | Gas-optimized read operations with pagination |
| **MockUsdt (ERC20)** | `0x694A10e38D1a7E3b15D6361AdaB4f3Be188b13CA` - `0.0.6881223` | Test USDT token for rewards |
| **Faucet** | `0x670AadeDF4C577454264Dcf03266729B786e7F6d` - `0.0.6926258` | Token distribution for testing (30 USDT/24h) |
| **WorkspaceNFT** | Deployed dynamically per workspace | ERC721 membership tokens (owner: Huddle contract) |

### Hedera Account IDs

| Account | ID | Purpose |
|---------|-----|---------|
| **Operator Account** | `0.0.6873100` | HCS topic creation, HFS file operations, message submission |
| **Deployer Account** | `0.0.6873100` | Smart contract deployment and initialization |

### HCS Topic IDs

Topic IDs are created dynamically for each workspace and task. Example format: `0.0.{topicId}`

- **Workspace Topics**: Created during workspace initialization ([Workspace.sol:332](contracts/contracts/Workspace.sol#L332))
- **Task Topics**: Created during task creation ([Workspace.sol:532](contracts/contracts/Workspace.sol#L532))

### HFS File IDs

File IDs are created dynamically when users attach files to tasks. Example format: `0.0.{fileId}`

- **Task Attachments**: Created via [upload-file API](client/src/app/api/upload-file/route.ts), stored in task metadata ([Workspace.sol:534](contracts/contracts/Workspace.sol#L534))

### Verification Links

- **Hashscan Explorer**: https://hashscan.io/testnet/contract/0xEBF42514DeD00D23358706bEB810223744Bc9BD5
- **Mirror Node API**: https://testnet.mirrornode.hedera.com/api/v1/contracts/0xEBF42514DeD00D23358706bEB810223744Bc9BD5

---

## Setup & Installation

### Prerequisites

- **Node.js 18+** and npm/pnpm/yarn
- **Hedera Testnet Account** with funded HBAR (get from [portal.hedera.com](https://portal.hedera.com) faucet)
- **Thirdweb Client ID** (free at [thirdweb.com](https://thirdweb.com))

### Quick Start (Under 10 Minutes)

#### Step 1: Clone Repository

```bash
git clone https://github.com/Michael-Nwachukwu/huddle.git
cd huddle
```

#### Step 2: Install Frontend Dependencies

```bash
cd client
npm install
```

#### Step 3: Configure Environment Variables

Create `client/.env.local`:

```bash
# Thirdweb (get from thirdweb.com/dashboard)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_THIRDWEB_SECRET_KEY=your_thirdweb_secret_key

# Hedera Operator Account (for HCS/HFS operations)
NEXT_PUBLIC_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
NEXT_PUBLIC_OPERATOR_KEY=302e020100300506032b657004220420YOUR_PRIVATE_KEY

# Server-side Hedera (same values, for API routes)
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420YOUR_PRIVATE_KEY

# Optional: AI chatbot (get from console.groq.com)
GROQ_API_KEY=your_groq_api_key
```

**How to Get Hedera Testnet Credentials:**
1. Visit [portal.hedera.com](https://portal.hedera.com)
2. Create account → Generate testnet credentials
3. Fund account via testnet faucet (500 HBAR free)
4. Copy Account ID (format: `0.0.xxxxx`) and Private Key

#### Step 4: Launch Frontend

```bash
npm run dev
```

The application will be available at **http://localhost:3000**

#### Step 5: Connect Wallet

1. Open http://localhost:3000 in your browser
2. Click "Connect Wallet" in the top-right corner
3. Select MetaMask/Rabby Wallet or use social logins for Absracted wallets
4. Approve connection to **Hedera Testnet** (Chain ID: 296)
5. If Hedera Testnet not detected, the app will prompt to add the network

#### Step 6: Get Test USDT

1. Click "Faucet" Icon on Navbar in dashboard page
2. Click "Claim 30 USDT" (once per 24 hours)
3. Approve transaction in wallet
4. USDT will appear in your connected wallet balance

### Optional: Deploy Contracts Locally

If you want to deploy your own smart contracts:

#### Step 1: Install Contract Dependencies

```bash
cd ../contracts
npm install
```

#### Step 2: Configure Deployment Environment

Create `contracts/.env`:

```bash
HEDERA_PRIVATE_KEY=302e020100300506032b6570042200YOUR_PRIVATE_KEY
```

#### Step 3: Compile Contracts

```bash
npx hardhat compile
```

#### Step 4: Run Tests (Optional)

```bash
npx hardhat test | cat
```

####Reminder 

```bash
# add network in harhat.config.ts
testnet: {
    type: "http",
    url: "https://testnet.hashio.io/api",
    accounts: [configVariable("HEDERA_PRIVATE_KEY")]
}
```

#### Step 5: Deploy to Hedera Testnet

```bash
npx hardhat run scripts/-file-.ts --network testnet
```

#### Step 6: Update Frontend Contract Addresses

Edit [client/src/lib/contract.ts](client/src/lib/contract.ts) and [client/src/lib/huddle-taskReader-contract.ts](client/src/lib/huddle-taskReader-contract.ts) with your new deployment addresses.

### Running Environment

- **Frontend**: Next.js dev server on `http://localhost:3000`
- **Backend**: Next.js API routes (built-in, no separate server)
- **Blockchain**: Hedera Testnet via Hashio RPC (`https://testnet.hashio.io/api`)
- **Mirror Node**: `https://testnet.mirrornode.hedera.com`

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15 | React framework (App Router) |
| **React** | 19.1.0 | UI library |
| **TailwindCSS** | 4 | Utility-first styling |
| **shadcn/ui** | Latest | Component library |
| **thirdweb SDK** | 5 | Web3 wallet & contract interactions |
| **Hedera SDK** | 2.73.1 | HCS, HFS, and Mirror Node operations |
| **TanStack Query** | 5 | Server state management & caching |
| **TanStack Table** | 8 | Advanced table components |
| **Framer Motion** | Latest | Animations |
| **React Hook Form** | Latest | Form handling |
| **Zod** | Latest | Schema validation |

### Smart Contracts

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | 0.8.28 | Smart contract language |
| **Hardhat** | 3.0.6 (Beta) | Development environment |
| **OpenZeppelin** | 5.4.0 | Secure contract libraries (ERC20, ERC721, ReentrancyGuard) |
| **ethers.js** | 6.15.0 | Contract deployment & interaction |
| **TypeScript** | 5.8.0 | Type-safe scripting |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Hashio RPC** | Hedera EVM JSON-RPC endpoint |
| **Mirror Node** | Historical data queries (transactions, balances, HCS messages) |
| **Hedera Testnet** | Network for smart contracts, HCS, HFS |

---

## Key Features

### 1. Workspace Management
- Create workspaces with unique ERC721 NFT contracts for membership
- Whitelist-based member invitations
- Owner-controlled permissions and settings
- Per-workspace chat via HCS topics
- Dashboard analytics (task counts, member activity, reward distribution)

### 2. Task Management
- Create tasks with multiple assignees
- Optional crypto rewards (HBAR or USDT)
- Task states: active → inProgress → completed → archived
- Priority levels: High, Medium, Low
- File attachments via HFS (documents, images, designs)
- Per-task HCS topic for discussions
- Task filtering by workspace, assignee, status, and priority
- Pagination support (50 tasks per page)

### 3. Reward System
- Support for native HBAR and ERC20 tokens (USDT)
- Rewards split equally among assignees
- Claim-based distribution (assignees must claim after task completion)
- Platform fee: 2.5% on all rewarded tasks
- ReentrancyGuard protection against double-claiming
- Balance tracking per workspace

### 4. Governance
- Create proposals with title, description, and 15-day voting period
- NFT-weighted voting (1 NFT = 1 vote)
- Vote options: Yes, No, Abstain
- Automatic proposal finalization after deadline
- Execution tracking and state management (Active, Executed, Defeated)

### 5. Decentralized Chat (HCS)
- Workspace-level chat channels
- Task-level discussion threads
- Immutable message history
- Cryptographically ordered messages
- Real-time polling (10-second refresh)
- Participant identification via Mirror Node

### 6. User Profile & Statistics
- Task completion history
- Proposal voting record
- Earnings tracking (HBAR + USDT)
- Workspace memberships
- Leaderboard ranking based on activity score

### 7. AI Assistant (Optional)
- Groq-powered chatbot for task suggestions
- Natural language task creation
- Governance proposal drafting
- Integration with Huddle data (tasks, workspaces, proposals)

---

## Economic Model

### Platform Fees

**Fee Structure:**
- **Rate**: 2.5% (250 basis points out of 10,000)
- **Maximum Allowed**: 5% (500 basis points)
- **Applied To**: Task rewards only (no fees on governance or non-rewarded tasks)

### Transaction Costs (Hedera Testnet)

| Operation | Estimated Cost (USD) | Notes |
|-----------|---------------------|-------|
| **Create Workspace** | $0.10 - 0.30 | Includes NFT contract deployment |
| **Create Task** | $0.05 - 0.15 | Higher if reward included |
| **Claim Reward** | $0.03 - 0.08 | Token transfer + state update |
| **Vote on Proposal** | $0.02 - 0.05 | Simple state update |
| **HCS Message** | $0.0001 | Per message (1000x cheaper than on-chain storage) |
| **HCS Topic Creation** | $0.01 | One-time per workspace/task |
| **HFS File Upload** | $0.05 per KB | One-time payment (no recurring costs) |

**Cost Advantage:**
Compared to Ethereum mainnet where a simple token transfer can cost $5-50 USD in gas, Hedera's fixed-fee model makes micro-transactions viable. A team exchanging 1,000 HCS messages and managing 100 tasks monthly pays ~$5-10 USD total, versus $500-5,000 on Ethereum.

### Supported Tokens

| Token | Address | Decimals | Purpose |
|-------|---------|----------|---------|
| **HBAR** | `0x0000000000000000000000000000000000000000` | 18 | Native token (gas + rewards) |
| **USDT (Mock)** | `0x694A10e38D1a7E3b15D6361AdaB4f3Be188b13CA` | 18 | Test stablecoin for rewards |

---

### Debugging Tips

**Check Contract Events:**
```bash
# View recent transactions
https://hashscan.io/testnet/contract/0xEBF42514DeD00D23358706bEB810223744Bc9BD5
```

**Query Mirror Node:**
```bash
# Get account info
curl https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.6873100

# Get HCS messages
curl https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.YOUR_TOPIC_ID/messages
```

**Test HCS Operations:**
```bash
cd client
npx ts-node src/lib/createTopic.ts
# Returns topic ID
```

---

## Troubleshooting

### Common Issues

**1. Wallet Not Connecting to Hedera Testnet**

**Symptoms:** MetaMask shows wrong network or "Switch Network" prompt

**Solution:**
- Click "Switch Network" in wallet prompt
- Or manually add Hedera Testnet:
  - Network Name: `Hedera Testnet`
  - RPC URL: `https://testnet.hashio.io/api`
  - Chain ID: `296`
  - Currency Symbol: `HBAR`
  - Explorer: `https://hashscan.io/testnet`

**2. Transaction Failures with "Insufficient Funds"**

**Symptoms:** Transactions revert with "insufficient funds for gas"

**Solution:**
- Fund account with testnet HBAR: https://portal.hedera.com (500 HBAR free)
- Check balance: https://hashscan.io/testnet/account/YOUR_ACCOUNT_ID
- Ensure account has at least 10 HBAR for multiple transactions

**3. HCS Topic Creation Failing**

**Symptoms:** Error "INVALID_SIGNATURE" or "PAYER_ACCOUNT_NOT_FOUND"

**Solution:**
- Verify `NEXT_PUBLIC_OPERATOR_ID` matches account ID format: `0.0.xxxxx`
- Verify `NEXT_PUBLIC_OPERATOR_KEY` is ED25519 private key (not ECDSA)
- Check key format: starts with `302e020100300506032b657004220420`
- Ensure operator account has HBAR balance (>1 HBAR)

**4. Contract Calls Reverting**

**Symptoms:** thirdweb transactions fail with "execution reverted"

**Solution:**
- Check contract addresses in [client/src/lib/contract.ts](client/src/lib/contract.ts)
- Verify contracts are deployed: https://hashscan.io/testnet/contract/ADDRESS
- Ensure wallet is connected to Hedera Testnet (Chain ID: 296)
- Check for required approvals (e.g., USDT approval before creating rewarded task)
- View revert reason in browser console or Hashscan transaction details

**5. HCS Messages Not Appearing**

**Symptoms:** Messages sent but not visible in chat

**Solution:**
- Wait 10 seconds for Mirror Node indexing (auto-refresh interval)
- Check topic ID is correct: https://hashscan.io/testnet/topic/YOUR_TOPIC_ID
- Verify Mirror Node is accessible: https://testnet.mirrornode.hedera.com/api/v1/topics/YOUR_TOPIC_ID/messages
- Clear browser cache and refresh page

**6. File Uploads Failing**

**Symptoms:** HFS file creation times out or errors

**Solution:**
- Reduce file size (recommended: <100 KB for testing)
- Check operator account HBAR balance (file operations require 2 HBAR per chunk)
- Verify `HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY` are set in `.env.local`
- Check API route logs: `npm run dev` output in terminal

**7. Faucet Claims Failing**

**Symptoms:** "Already claimed" or "Insufficient balance" errors

**Solution:**
- Wait 24 hours between claims (cooldown period)
- Check faucet contract balance: https://hashscan.io/testnet/contract/0x670AadeDF4C577454264Dcf03266729B786e7F6d
- Owner can refill faucet with `faucetContract.withdraw()` then `usdtContract.transfer(faucetAddress, amount)`

**8. Governance Votes Not Counting**

**Symptoms:** Vote transaction succeeds but count doesn't update

**Solution:**
- Verify you hold workspace NFT: call `workspaceNftContract.balanceOf(yourAddress)`
- Check proposal deadline hasn't passed
- Refresh page to see updated vote count
- View transaction on Hashscan to confirm state change

### Getting Help

- **Hedera Discord**: https://hedera.com/discord
- **GitHub Issues**: https://github.com/Michael-Nwachukwu/huddle/issues
- **Hedera Docs**: https://docs.hedera.com
- **thirdweb Support**: https://thirdweb.com/support

---

## Project Structure

```
huddle/
├── client/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/               # Next.js 15 App Router
│   │   │   ├── dashboard/     # Main app pages
│   │   │   │   ├── tasks/    # Task management UI
│   │   │   │   ├── governance/ # Proposals & voting UI
│   │   │   │   ├── channel/  # HCS chat interface
│   │   │   │   ├── account/  # User profile & stats
│   │   │   │   └── bot/      # AI assistant
│   │   │   ├── workspace/
│   │   │   │   ├── create/   # Workspace creation flow
│   │   │   │   └── join/     # Join workspace flow
│   │   │   └── api/          # Next.js API routes
│   │   │       ├── create-topic/  # HCS topic creation
│   │   │       ├── submit-message/ # HCS message submission
│   │   │       ├── upload-file/   # HFS file upload
│   │   │       ├── retrieve-file/ # HFS file retrieval
│   │   │       └── chat/         # AI chatbot endpoint
│   │   ├── components/       # React components (58 files)
│   │   ├── hooks/            # Custom React hooks (13+ hooks)
│   │   ├── lib/              # Blockchain utilities
│   │   │   ├── contract.ts   # Huddle contract client
│   │   │   ├── huddle-taskReader-contract.ts
│   │   │   ├── createTopic.ts # HCS utilities
│   │   │   └── createFile.ts  # HFS utilities
│   │   ├── utils/            # Helper functions
│   │   │   ├── chains.ts     # Hedera chain config
│   │   │   └── client.ts     # thirdweb client setup
│   │   └── contexts/         # React contexts
│   ├── package.json
│   └── .env.local            # Environment variables
│
├── contracts/                 # Hardhat smart contracts
│   ├── contracts/
│   │   ├── Workspace.sol     # Main contract (1,217 lines)
│   │   ├── HuddleTaskReader.sol # Read operations (421 lines)
│   │   ├── WorkspaceNft.sol  # ERC721 membership (17 lines)
│   │   ├── MockUsdt.sol      # Test ERC20 (17 lines)
│   │   ├── Faucet.sol        # Token distribution (94 lines)
│   │   └── HuddleLib.sol     # Utility library (105 lines)
│   ├── scripts/              # Deployment scripts
│   │   ├── deployMockUsdt.ts
│   │   ├── deployHuddleContract.ts
│   │   ├── deployHuddleTaskReader.ts
│   │   └── deployFaucet.ts
│   ├── test/                 # Contract tests (Mocha/Chai)
│   ├── hardhat.config.ts     # Hardhat configuration
│   ├── deployed_addresses.md # Deployment tracking
│   └── package.json
│
└── README.md                  # This file
```

---

## Security Considerations

### Smart Contract Security

**1. Reentrancy Protection:**
- `ReentrancyGuard` modifier on `claim()` function ([Workspace.sol:886](contracts/contracts/Workspace.sol#L886))
- Checks-Effects-Interactions pattern enforced

**2. Access Control:**
- `onlyWorkspaceOwner` modifier for admin functions
- `onlyWorkspaceMember` modifier for member-only operations
- `onlyOwner` modifier for platform admin functions

**3. Safe Token Operations:**
- `SafeERC20` for all token transfers
- Prevents silent failures with non-standard ERC20 implementations

**4. Input Validation:**
- `validateAddress()` checks for zero addresses
- `validateString()` ensures non-empty strings
- Array length limits to prevent gas griefing

**5. Integer Overflow Protection:**
- Solidity 0.8.28 has built-in overflow checks
- Unchecked blocks used only where overflow is impossible

### Known Limitations

**1. Private Keys in Environment:**
- **Issue:** `NEXT_PUBLIC_OPERATOR_KEY` is client-side accessible
- **Recommendation:** Move all HCS/HFS operations to API routes (server-side only)
- **Mitigation:** Use testnet-only keys with limited funds

**2. No Rate Limiting:**
- **Issue:** API routes lack rate limiting
- **Risk:** Potential DoS via excessive HCS message submissions
- **Recommendation:** Implement rate limiting middleware (e.g., `next-rate-limit`)

**3. Centralized Operator:**
- **Issue:** Single operator account for all HCS/HFS operations
- **Risk:** Single point of failure
- **Recommendation:** Implement key rotation and multi-operator setup

### Audit Status

**Status:** Not audited (testnet deployment only)

**Before Mainnet Deployment:**
- Conduct third-party security audit (recommended: OpenZeppelin, CertiK, or Quantstamp)
- Implement bug bounty program
- Add emergency pause mechanism for critical vulnerabilities
- Set up monitoring and alerting for suspicious transactions

---

## Roadmap

### Phase 1: Core Features (Completed)
- ✅ Workspace creation with NFT membership
- ✅ Task management with crypto rewards
- ✅ HCS-based chat
- ✅ HFS file attachments
- ✅ Governance proposals and voting
- ✅ User statistics and leaderboards

### Phase 2: Mainnet Preparation (Q2 2025)
- Security audit and fixes
- Gas optimization
- Multi-operator HCS/HFS setup
- Rate limiting and DDoS protection
- Comprehensive test suite (unit + integration)

### Phase 3: Enhanced Features (Q3 2025)
- Recurring tasks and subtasks
- Custom proposal types (treasury, membership, parameter changes)
- NFT marketplace for workspace memberships
- Analytics dashboard (treasury history, member activity heatmaps)
- Mobile app (React Native)

### Phase 4: Ecosystem Integration (Q4 2025)
- HTS (Hedera Token Service) integration for custom workspace tokens
- Multisig workspace ownership
- Integration with Hedera native staking
- Cross-workspace collaborations
- DAO tooling (treasury management, vesting schedules)

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

**Code Standards:**
- Use TypeScript for all new files
- Follow existing code style (ESLint configuration)
- Add tests for smart contract changes
- Update documentation for user-facing features

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Acknowledgments

- **Hedera Team** for excellent documentation and developer support
- **thirdweb** for seamless Web3 SDK
- **OpenZeppelin** for battle-tested smart contract libraries
- **Hashio** for free RPC access
- **shadcn/ui** for beautiful React components

---

## Contact

- **Project Lead**: Michael Nwachukwu
- **GitHub**: https://github.com/Michael-Nwachukwu/huddle
- **Demo**: http://localhost:3000 (after local setup)
- **Hedera Discord**: https://hedera.com/discord

---

**Built with ❤️ on Hedera Testnet**
