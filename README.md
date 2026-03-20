# ChainVote — On-Chain Voting dApp

A Next.js 14 dApp for creating and voting on polls stored on the Ethereum Sepolia testnet.

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Deploy to production
```bash
npm run build
npm start
```

## Deploy to Vercel (free)
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Click Deploy — that's it!

## Project Structure
```
chainvote/
├── app/
│   ├── page.tsx          ← Main page
│   ├── page.module.css   ← Page styles
│   ├── layout.tsx        ← Root layout
│   └── globals.css       ← Global styles
├── components/
│   ├── Header.tsx        ← Wallet connect button
│   ├── PollCard.tsx      ← Individual poll display
│   ├── VoteModal.tsx     ← Voting modal
│   ├── CreatePoll.tsx    ← Create poll form
│   └── Toast.tsx         ← Notifications
├── lib/
│   ├── contract.ts       ← Contract address + ABI
│   ├── useWallet.ts      ← Wallet connection hook
│   └── usePolls.ts       ← Polls data hook
└── global.d.ts           ← TypeScript types
```

## Smart Contract
- **Network:** Sepolia Testnet
- **Address:** `0xb9333b036dc625ECc533CB9EeB6d3db8D5407F59`
- **Etherscan:** https://sepolia.etherscan.io/address/0xb9333b036dc625ECc533CB9EeB6d3db8D5407F59
