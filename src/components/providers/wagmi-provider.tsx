"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "@wagmi/core";
import { createConfig, http, WagmiProvider } from "wagmi";

import { ARC_RPC_URL, arcTestnet } from "@/lib/arc/chains";

const wagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [injected()],
  ssr: true,
  transports: {
    [arcTestnet.id]: http(ARC_RPC_URL || undefined),
  },
});

export function AppWagmiProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
