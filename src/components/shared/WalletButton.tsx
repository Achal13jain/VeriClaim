"use client";

import { Cable, Unplug, Wallet } from "lucide-react";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";

import { Button } from "@/components/ui/button";
import { arcTestnet } from "@/lib/arc/chains";
import { formatHash } from "@/lib/utils";

export function WalletButton() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const injectedConnector = connectors[0];
  const wrongNetwork = isConnected && chainId !== arcTestnet.id;

  if (!isConnected) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!injectedConnector || isPending}
        onClick={() => injectedConnector && connect({ connector: injectedConnector })}
        className="hidden lg:inline-flex"
      >
        <Wallet />
        {isPending ? "Connecting" : "Wallet"}
      </Button>
    );
  }

  if (wrongNetwork) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={switching}
        onClick={() => switchChain({ chainId: arcTestnet.id })}
        className="hidden lg:inline-flex"
      >
        <Cable />
        {switching ? "Switching" : "Arc Testnet"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => disconnect()}
      className="hidden lg:inline-flex"
    >
      <Unplug />
      {address ? formatHash(address, 6, 4) : "Wallet"}
    </Button>
  );
}
