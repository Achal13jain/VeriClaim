import { BadgeDollarSign } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function X402PaymentBadge({
  state = "mock-unlocked",
}: {
  state?: "required" | "mock-unlocked" | "disabled";
}) {
  const label =
    state === "required"
      ? "Mock x402 required"
      : state === "disabled"
        ? "x402 demo bypass"
        : "Mock x402 unlocked";

  return (
    <Badge variant={state === "required" ? "warning" : "violet"} className="gap-1.5">
      <BadgeDollarSign className="size-3.5" />
      {label}
    </Badge>
  );
}
