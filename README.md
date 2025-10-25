## Stapal — On-chain Taiwan Receipt Lottery Powered by PYUSD

### 🧩 **What It Does**

**Stapal** transforms Taiwan’s decades-old _Uniform Invoice Lottery_ — one of the world’s most successful civic financial systems — into a fully automated, transparent, and borderless on-chain version.

In Taiwan, every government-issued sales receipt carries a unique 8-digit number. Every two months, the Ministry of Finance publicly draws winning numbers, and citizens whose receipts match can win between NT$200 and NT$10 million. The system’s core purpose is to combat tax evasion and promote transaction transparency by encouraging consumers to always request official receipts.

Stapal replicates this system **exactly as it works today**, but with two key blockchain-driven improvements:

1. **Instant PYUSD Payouts:**
   Users pay approved merchants using **PYUSD**. Each transaction automatically generates a receipt entry tied to their wallet. When the official draw occurs, prizes are **automatically converted from TWD to PYUSD** and distributed instantly on-chain — solving the real-world pain point where users forget to claim winnings or miss deadlines.

2. **Provable Fairness and Price Transparency:**
   Stapal uses **Pyth Entropy** to generate a verifiable random draw, ensuring fairness without any centralized control. The **Pyth USD/TWD pull price feed** dynamically converts prize amounts (denominated in TWD per Taiwan’s official rules) into the equivalent PYUSD value, allowing prize distribution to remain stable and pegged to real-world currency.

---

### 💡 **Why It Matters**

Stapal demonstrates how **PYUSD** can power real-world, large-scale payment experiences beyond Web3 — modernizing proven public systems with programmable transparency.

- **Payments Applicability:** It uses PYUSD as the transactional and reward medium, proving its capacity to handle high-frequency microtransactions, reward flows, and merchant adoption use cases.
- **Transformative Finance:** It showcases how governments and fintechs could use PYUSD for citizen engagement, tax incentive programs, and universal rebate systems — with instant settlement, zero manual claiming, and verifiable fairness.
- **Pyth Integration:** It leverages both **Pyth Entropy** for randomness and **Pyth Pull Price Feeds** for real-time FX rates (USD/TWD), demonstrating real composability of oracle infrastructure in civic-grade financial automation.

In short, Stapal doesn’t reinvent the wheel — it **puts a proven wheel on rails**, combining the trust of a national system with the efficiency and global reach of PYUSD payments.

---

## ⚙️ **How It’s Made**

**Architecture Overview:**
Stapal is built entirely on smart contracts deployed on **Arbitrum Sepolia**, integrating **PYUSD**, **Pyth Entropy**, and **Pyth Pull Price Feeds**.

### 🧠 **Smart Contract Components (Solidity)**

- **`Stapal.sol`** — the main contract managing merchants, receipts, and prize draws:

  - `buy(sender, receiver, amount)`: Processes PYUSD payments from buyers to approved merchants and stores receipt data (address + pseudo-random 8-digit number).
  - `requestRandomNumber()`: Requests entropy from **Pyth Entropy** to generate verifiable randomness for each draw.
  - `entropyCallback(...)`: Receives callback with the random value and stores the current 8-digit winning seed (`currentVrf`).
  - `drawWinners()`: Derives the 4–7 digit winning patterns from `currentVrf` and maps them to stored receipts to determine eligible winners.
  - `updatePriceAndDistribute(bytes[] priceUpdate)`: Fetches the latest **Pyth USD/TWD price** from Hermes, converts each TWD prize tier into its PYUSD equivalent, and sends rewards directly to winning wallets.

- **`MockPYUSD.sol`** — minimal ERC20 token for local testing and demonstration.

**Prize Rules Implemented (1:1 official structure):**

- Match 7 digits → 1,000,000 TWD
- Match 6 digits → 50,000 TWD
- Match 5 digits → 10,000 TWD
- Match 4 digits → 1,000 TWD

All prizes are converted to PYUSD based on the latest **Pyth USD/TWD exchange rate**, ensuring accuracy and real-world parity.

---

### 🌐 **Frontend & API Layer**

- **Frontend**: A minimal Next.js interface where users can:

  - Pay merchants in PYUSD.
  - View past receipts and see draw results.

- **Backend (API Route)**:

  - `/api/draw`: Executes a full draw sequence:

    1. Read entropy fee and request randomness via **Pyth Entropy**.
    2. Wait for callback with random value.
    3. Trigger `drawWinners()` and `updatePriceAndDistribute()` after pulling FX data.

**Contracts Deployed:**

- `Stapal`: [0x6e6ba8c9960b6B94dFDafB3EB31D4BC7398e34A5](https://arbitrum-sepolia.blockscout.com/address/0x6e6ba8c9960b6B94dFDafB3EB31D4BC7398e34A5)
- `MockPYUSD`: [0x6bfC592fB6779BE62346C76347f8aed209D28346](https://arbitrum-sepolia.blockscout.com/address/0x6bfC592fB6779BE62346C76347f8aed209D28346)

---

### 🧩 **Partner Tech Stack**

| Technology                         | Purpose                      | Benefit                                                                         |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| **PYUSD**                          | Medium of payment and payout | Real, stable, and composable digital dollar for programmable civic rewards      |
| **Pyth Entropy**                   | Random draw generation       | Fully decentralized, verifiable randomness replacing centralized draw officials |
| **Pyth Pull Price Feed (USD/TWD)** | FX conversion                | Real-time on-chain conversion from TWD prizes to PYUSD                          |

---

### 🚀 **Future Vision**

- **Merchant SDK:** Allow businesses globally to register as “Stapal merchants” and issue receipt entries automatically for PYUSD payments.
- **Global Adaptation:** Extend beyond Taiwan — governments and fintechs can use the same protocol for rebate programs, tax credits, or savings lotteries.
- **Official Partnerships:** Integrate with PYUSD ecosystem wallets or PayPal consumer products for mass user onboarding.

---

### 🏁 **Final Words**

Stapal is the **most faithful real-world replication** of a proven national finance system ever brought on-chain.
It demonstrates how **PYUSD and Pyth together** can create an **autonomous, transparent, and programmable payments network** — bridging fiat systems and Web3 infrastructure at national scale.

It’s not a new idea. It’s the _right idea_, made real with **PYUSD precision and Pyth truth.**
