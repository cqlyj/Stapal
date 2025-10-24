"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { createConfig } from "wagmi";

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc"),
  },
});

export function PrivyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "your-privy-app-id"}
      config={{
        loginMethods: ["wallet", "email"],
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
        },
        defaultChain: arbitrumSepolia,
        supportedChains: [arbitrumSepolia],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
