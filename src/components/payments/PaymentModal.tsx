"use client";

import { BadgeDollarSign, Coins, Loader2, ShieldCheck, X } from "lucide-react";

import { X402PaymentBadge } from "@/components/shared/X402PaymentBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/payments/x402";

export function PaymentModal({
  open,
  credits,
  priceUsd,
  busy,
  onClose,
  onUseCredit,
  onMockPayment,
}: {
  open: boolean;
  credits: number;
  priceUsd: number;
  busy: "credit" | "mock" | null;
  onClose: () => void;
  onUseCredit: () => void;
  onMockPayment: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 p-4 backdrop-blur-xl">
      <div className="glass-panel w-full max-w-lg rounded-lg p-5 shadow-glow">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <X402PaymentBadge state="required" />
              <Badge variant="glass">Mock mode</Badge>
            </div>
            <h2 className="font-display text-3xl leading-none">
              Unlock one Forge run.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              First 3 generations are free. After that, VeriClaim uses Forge
              Credits or a mock x402 unlock to model future paid validation.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={busy !== null}
            onClick={onClose}
            aria-label="Close payment modal"
          >
            <X />
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            disabled={credits <= 0 || busy !== null}
            onClick={onUseCredit}
            className="rounded-md border border-border/70 bg-background/65 p-4 text-left transition hover:border-court-green/50 hover:bg-court-green/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md border border-emerald-400/30 bg-emerald-400/12 text-emerald-500">
                  <Coins className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">Use 1 Forge Credit</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Current balance: {credits} credits.
                  </p>
                </div>
              </div>
              {busy === "credit" ? <Loader2 className="size-4 animate-spin" /> : null}
            </div>
          </button>

          <button
            type="button"
            disabled={busy !== null}
            onClick={onMockPayment}
            className="rounded-md border border-violet-400/30 bg-violet-400/10 p-4 text-left transition hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md border border-violet-400/30 bg-violet-400/12 text-violet-500">
                  <BadgeDollarSign className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">
                    Mock x402 unlock {formatUsd(priceUsd)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Creates a demo receipt only. No real money moves.
                  </p>
                </div>
              </div>
              {busy === "mock" ? <Loader2 className="size-4 animate-spin" /> : null}
            </div>
          </button>
        </div>

        <div className="mt-4 flex gap-3 rounded-md border border-sky-400/25 bg-sky-400/10 p-3 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-court-blue" />
          <span>
            VeriClaim currently uses mock x402. Real payment support is planned
            and can reuse this unlock flow later.
          </span>
        </div>
      </div>
    </div>
  );
}
