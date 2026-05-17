"use client";

import { motion } from "framer-motion";
import { Award, Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function RewardToast({
  creditsDelta,
  reputationDelta,
  badgesAwarded = [],
  message = "Reward applied",
}: {
  creditsDelta: number;
  reputationDelta: number;
  badgesAwarded?: string[];
  message?: string;
}) {
  if (!creditsDelta && !reputationDelta && badgesAwarded.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.28 }}
      className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border border-emerald-400/30 bg-background/95 p-4 shadow-glow backdrop-blur-xl"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-emerald-400/30 bg-emerald-400/12 text-emerald-500">
          <Award className="size-5" />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="font-semibold">{message}</p>
          <div className="flex flex-wrap gap-2">
            {reputationDelta ? (
              <Badge variant={reputationDelta > 0 ? "success" : "warning"}>
                {reputationDelta > 0 ? "+" : ""}
                {reputationDelta} rep
              </Badge>
            ) : null}
            {creditsDelta ? (
              <Badge variant="blue" className="gap-1.5">
                <Coins className="size-3.5" />
                {creditsDelta > 0 ? "+" : ""}
                {creditsDelta} credits
              </Badge>
            ) : null}
            {badgesAwarded.map((badge) => (
              <Badge key={badge} variant="violet">
                {badge}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
