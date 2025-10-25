"use client";

import { usePrivy } from "@privy-io/react-auth";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { useState } from "react";
import { STAPAL_ABI, PYUSD_ABI } from "@/contracts/abis";
import { CONTRACT_ADDRESSES } from "@/contracts/addresses";
import { parseUnits } from "viem";
import { arbitrumSepolia } from "viem/chains";

export default function Home() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const isArbitrumSepolia = chainId === 421614;

  // Form states
  const [buyForm, setBuyForm] = useState({
    sender: "",
    receiver: "",
    amount: "",
  });
  const [merchantAddress, setMerchantAddress] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawProgress, setDrawProgress] = useState<
    {
      step: string;
      status: "pending" | "processing" | "completed" | "error";
      txHash?: string;
      message?: string;
    }[]
  >([]);

  // Buy function
  const handleBuy = async () => {
    if (!buyForm.sender || !buyForm.receiver || !buyForm.amount) {
      alert("Please fill all buy fields");
      return;
    }

    try {
      // First approve PYUSD transfer
      const amountWei = parseUnits(buyForm.amount, 6); // PYUSD has 6 decimals

      writeContract({
        address: CONTRACT_ADDRESSES.PYUSD,
        abi: PYUSD_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.STAPAL, amountWei],
      });

      // Then call buy on Stapal contract
      // Note: In a production app, you'd wait for approval confirmation first
      setTimeout(() => {
        writeContract({
          address: CONTRACT_ADDRESSES.STAPAL,
          abi: STAPAL_ABI,
          functionName: "buy",
          args: [
            buyForm.sender as `0x${string}`,
            buyForm.receiver as `0x${string}`,
            amountWei,
          ],
        });
      }, 2000);
    } catch (error) {
      console.error("Buy error:", error);
      alert("Transaction failed. Check console for details.");
    }
  };

  // Add merchant function
  const handleAddMerchant = async () => {
    if (!merchantAddress) {
      alert("Please enter merchant address");
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.STAPAL,
        abi: STAPAL_ABI,
        functionName: "addMerchant",
        args: [merchantAddress as `0x${string}`],
      });
    } catch (error) {
      console.error("Add merchant error:", error);
      alert("Transaction failed. Check console for details.");
    }
  };

  // Deposit function
  const handleDeposit = async () => {
    if (!depositAmount) {
      alert("Please enter deposit amount");
      return;
    }

    try {
      const amountWei = parseUnits(depositAmount, 6);

      // First approve
      writeContract({
        address: CONTRACT_ADDRESSES.PYUSD,
        abi: PYUSD_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.STAPAL, amountWei],
      });

      // Then deposit
      setTimeout(() => {
        writeContract({
          address: CONTRACT_ADDRESSES.STAPAL,
          abi: STAPAL_ABI,
          functionName: "deposit",
          args: [amountWei],
        });
      }, 2000);
    } catch (error) {
      console.error("Deposit error:", error);
      alert("Transaction failed. Check console for details.");
    }
  };

  // Draw function - calls API route for server-side transaction signing
  const handleDraw = async () => {
    setIsDrawing(true);
    setDrawProgress([]);

    try {
      console.log("=== Starting Draw Process ===");

      const response = await fetch("/api/draw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        console.error("API returned error:", data);
        throw new Error(data.error || data.details || "Draw process failed");
      }

      setDrawProgress(data.updates);
      alert("Draw completed successfully!");
    } catch (error) {
      console.error("=== Draw Error ===");
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(`Draw failed: ${errorMessage}\n\nCheck console for more details.`);
    } finally {
      setIsDrawing(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Stapal</h1>
          <p className="text-gray-600">
            Decentralized Payment Lottery on Arbitrum Sepolia
          </p>
        </div>

        {/* Wallet Connection Section */}
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
            Wallet Connection
          </h2>

          {!authenticated ? (
            <div className="text-center">
              <button
                onClick={login}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Connect Wallet
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Connect to Arbitrum Sepolia testnet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Connected
                    </p>
                    <p className="text-xs text-green-600 truncate">{address}</p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-800">Network</p>
                <p className="text-xs text-blue-600">
                  {isArbitrumSepolia
                    ? "Arbitrum Sepolia ✓"
                    : `Wrong Network: Chain ID ${chainId}`}
                </p>
              </div>

              {!isArbitrumSepolia && (
                <button
                  onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                >
                  Switch to Arbitrum Sepolia
                </button>
              )}

              <button
                onClick={logout}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {authenticated && (
          <div className="max-w-4xl mx-auto">
            {!isArbitrumSepolia && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 text-center">
                  ⚠️ Please switch to Arbitrum Sepolia testnet for full
                  functionality
                </p>
              </div>
            )}

            {/* Buy Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Buy (Transfer PYUSD)
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Sender Address"
                  value={buyForm.sender}
                  onChange={(e) =>
                    setBuyForm({ ...buyForm, sender: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  placeholder="Receiver Address (Merchant)"
                  value={buyForm.receiver}
                  onChange={(e) =>
                    setBuyForm({ ...buyForm, receiver: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  placeholder="Amount (PYUSD)"
                  value={buyForm.amount}
                  onChange={(e) =>
                    setBuyForm({ ...buyForm, amount: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleBuy}
                  disabled={isPending || isConfirming}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
                >
                  {isPending || isConfirming ? "Processing..." : "Buy"}
                </button>
              </div>
            </div>

            {/* Add Merchant Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Add Merchant (Admin Only)
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Merchant Address"
                  value={merchantAddress}
                  onChange={(e) => setMerchantAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleAddMerchant}
                  disabled={isPending || isConfirming}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
                >
                  {isPending || isConfirming ? "Processing..." : "Add Merchant"}
                </button>
              </div>
            </div>

            {/* Deposit Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Deposit PYUSD (Admin Only)
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Amount (PYUSD)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleDeposit}
                  disabled={isPending || isConfirming}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
                >
                  {isPending || isConfirming ? "Processing..." : "Deposit"}
                </button>
              </div>
            </div>

            {/* Draw Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Draw Lottery (Admin Only)
              </h3>

              <button
                onClick={handleDraw}
                disabled={isDrawing}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {isDrawing ? "Processing..." : "Draw Lottery"}
              </button>

              {/* Progress Indicator */}
              {drawProgress.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="font-semibold text-gray-700">
                    Draw Progress:
                  </h4>
                  {drawProgress.map((update, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        update.status === "completed"
                          ? "bg-green-50 border-green-200"
                          : update.status === "error"
                          ? "bg-red-50 border-red-200"
                          : update.status === "processing"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {update.step === "requestRandomNumber"
                            ? "Step 1: Request Random Number"
                            : update.step === "waiting"
                            ? "⏳ Waiting for Callback"
                            : update.step === "drawWinners"
                            ? "Step 2: Draw Winners"
                            : update.step === "updatePriceAndDistribute"
                            ? "Step 3: Update Price & Distribute"
                            : update.step}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            update.status === "completed"
                              ? "bg-green-600 text-white"
                              : update.status === "error"
                              ? "bg-red-600 text-white"
                              : update.status === "processing"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-400 text-white"
                          }`}
                        >
                          {update.status.toUpperCase()}
                        </span>
                      </div>
                      {update.message && (
                        <p className="text-xs text-gray-600 mb-1">
                          {update.message}
                        </p>
                      )}
                      {update.txHash && (
                        <a
                          href={`https://sepolia.arbiscan.io/tx/${update.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          View Transaction: {update.txHash.slice(0, 10)}...
                          {update.txHash.slice(-8)}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transaction Status */}
            {hash && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Transaction Status
                </h3>
                <p className="text-sm text-gray-600 break-all mb-2">
                  Hash: {hash}
                </p>
                {isConfirming && (
                  <p className="text-sm text-blue-600">
                    Waiting for confirmation...
                  </p>
                )}
                {isConfirmed && (
                  <p className="text-sm text-green-600">
                    Transaction confirmed!
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
