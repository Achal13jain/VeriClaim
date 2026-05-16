"use client";

import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, Fingerprint, Scale } from "lucide-react";

import { ReputationBadge } from "@/components/vericlaim/reputation-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AgentProfile } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function AgentCard({ agent }: { agent: AgentProfile }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="h-full"
    >
      <Card className="glass-panel h-full overflow-hidden">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-sky-400/30 bg-sky-400/12 text-sky-600 dark:text-sky-300">
              <Scale className="size-6" />
            </div>
            <Badge variant="violet" className="gap-1.5">
              <Fingerprint className="size-3.5" />
              {agent.identityMode}
            </Badge>
          </div>
          <div>
            <CardTitle>{agent.name}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {agent.latestVerdict}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{agent.role}</Badge>
            <Badge variant="glass" className="gap-1.5">
              <BrainCircuit className="size-3.5" />
              {agent.modelProvider}
            </Badge>
            <ReputationBadge reputation={agent.reputationScore} label="Rep" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border/70 bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">Validations</div>
              <div className="mt-1 font-mono text-xl">
                {formatNumber(agent.validationCount)}
              </div>
            </div>
            <div className="rounded-md border border-border/70 bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">Win rate</div>
              <div className="mt-1 font-mono text-xl">{agent.winRate}%</div>
            </div>
          </div>
          <div className="space-y-2">
            {agent.specialties.map((specialty) => (
              <div
                key={specialty}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="size-4 text-court-green" />
                {specialty}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
