"use client";

import { BadgeDollarSign, Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PaymentRecord } from "@/lib/payments/types";
import { formatUsd } from "@/lib/payments/x402";
import { formatHash } from "@/lib/utils";

export function PaymentHistory({
  payments,
  loading,
}: {
  payments: PaymentRecord[];
  loading: boolean;
}) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BadgeDollarSign className="size-5 text-court-violet" />
            Payment history
          </CardTitle>
          <Badge variant="violet">Mock x402</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3" aria-label="Loading payment history">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 rounded-md border border-border/70 bg-background/60 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="size-9 animate-pulse rounded-md bg-muted/70" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted/70" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
                  </div>
                </div>
                <div className="h-6 w-16 animate-pulse rounded-md bg-muted/60" />
              </div>
            ))}
          </div>
        ) : null}
        {!loading && !payments.length ? (
          <div className="rounded-md border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
            No unlocks yet. After the first 3 free forges, mock x402 receipts
            and Forge Credit unlocks will appear here.
          </div>
        ) : null}
        {payments.map((payment) => (
          <div
            key={payment.id ?? payment.txReference}
            className="flex items-center justify-between gap-4 rounded-md border border-border/70 bg-background/60 p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-violet-400/30 bg-violet-400/12 text-violet-500">
                {payment.mode === "forge_credit" ? (
                  <Coins className="size-4" />
                ) : (
                  <BadgeDollarSign className="size-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {payment.mode === "forge_credit"
                    ? "Forge Credit unlock"
                    : "Mock x402 payment"}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {formatHash(payment.txReference, 16, 8)}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <Badge variant={payment.mode === "forge_credit" ? "blue" : "violet"}>
                {payment.mode === "forge_credit"
                  ? `${payment.creditsSpent} credit`
                  : formatUsd(payment.amountUsd)}
              </Badge>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(payment.createdAt).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
