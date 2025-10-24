"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";
import { useAccount, useChainId } from "wagmi";

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const isArbitrumSepolia = chainId === 421614; // Arbitrum Sepolia chain ID

  const handleBuy = () => {
    console.log("Buy button clicked");
    // Add buy functionality here
  };

  const handleAddMerchant = () => {
    console.log("AddMerchant button clicked");
    // Add merchant functionality here
  };

  const handleDeposit = () => {
    console.log("Deposit button clicked");
    // Add deposit functionality here
  };

  const handleDraw = () => {
    console.log("Draw button clicked");
    // Add draw functionality here
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
          <p className="text-lg text-gray-600">
            Your decentralized payment platform
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
                    ? "Arbitrum Sepolia"
                    : `Chain ID: ${chainId}`}
                </p>
              </div>

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
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleBuy}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                <div className="text-lg">Buy</div>
                <div className="text-sm opacity-90">Purchase tokens</div>
              </button>

              <button
                onClick={handleAddMerchant}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                <div className="text-lg">Add Merchant</div>
                <div className="text-sm opacity-90">Register new merchant</div>
              </button>

              <button
                onClick={handleDeposit}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                <div className="text-lg">Deposit</div>
                <div className="text-sm opacity-90">Add funds to account</div>
              </button>

              <button
                onClick={handleDraw}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                <div className="text-lg">Draw</div>
                <div className="text-sm opacity-90">Withdraw funds</div>
              </button>
            </div>

            {!isArbitrumSepolia && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 text-center">
                  ⚠️ Please switch to Arbitrum Sepolia testnet for full
                  functionality
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions for non-connected users */}
        {!authenticated && (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
              Get Started
            </h3>
            <p className="text-gray-600 text-center">
              Connect your wallet to access the Stapal platform and start using
              our services.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
