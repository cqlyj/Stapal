# Stapal Frontend

A Next.js frontend application for the Stapal decentralized payment platform.

## Features

- Wallet connection using Privy
- Support for Arbitrum Sepolia testnet
- Action buttons: Buy, AddMerchant, Deposit, Draw
- Modern UI with Tailwind CSS

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory and add:

```
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here
```

3. Get a Privy App ID:

   - Go to [Privy Dashboard](https://dashboard.privy.io/)
   - Create a new app
   - Copy your App ID and replace `your-privy-app-id-here` in the `.env.local` file

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click "Connect Wallet" to connect your wallet
2. Make sure you're connected to Arbitrum Sepolia testnet
3. Use the action buttons to interact with the platform:
   - **Buy**: Purchase tokens
   - **AddMerchant**: Register new merchant
   - **Deposit**: Add funds to account
   - **Draw**: Withdraw funds

## Network Configuration

The app is configured for Arbitrum Sepolia testnet (Chain ID: 421614). Make sure your wallet is connected to this network for full functionality.
