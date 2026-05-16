"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Gavel, Scale, SearchCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AgentTraceStep, AgentRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const roleIcon: Record<AgentRole, React.ElementType> = {
  forger: Gavel,
  critic: SearchCheck,
  judge: Scale,
};

const roleColor: Record<AgentRole, string> = {
  forger: "text-court-blue",
  critic: "text-court-amber",
  judge: "text-court-green",
};

const defaultSteps: AgentTraceStep[] = [
  {
    agentId: "forger-001",
    role: "forger",
    title: "Forger drafts",
    summary:
      "Normalizes the messy claim into a binary, dated MarketSpec candidate.",
    status: "complete",
    score: 88,
  },
  {
    agentId: "critic-001",
    role: "critic",
    title: "Critic attacks",
    summary:
      "Searches for ambiguity, weak sources, missing edge cases, and subjective language.",
    status: "complete",
    score: 91,
  },
  {
    agentId: "judge-001",
    role: "judge",
    title: "Judge rules",
    summary:
      "Blesses, revises, rejects, or challenges the final MarketSpec for publication.",
    status: "complete",
    score: 94,
  },
];

export function AgentCourtTimeline({
  steps = defaultSteps,
  activeRole,
}: {
  steps?: AgentTraceStep[];
  activeRole?: AgentRole;
}) {
  return (
    <div className="relative">
      <div className="absolute left-5 top-8 hidden h-[calc(100%-4rem)] w-px bg-border md:block" />
      <div className="grid gap-4">
        {steps.map((step, index) => {
          const Icon = roleIcon[step.role];
          const active = activeRole ? activeRole === step.role : true;

          return (
            <motion.div
              key={`${step.agentId}-${step.title}`}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className={cn(
                "relative rounded-lg border border-border/70 bg-background/70 p-4 backdrop-blur-xl",
                active && "shadow-glow",
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-md border border-border/70 bg-card",
                    roleColor[step.role],
                    active && "animate-pulse-ring",
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{step.title}</h3>
                    <Badge variant="glass" className="font-mono">
                      {step.role}
                    </Badge>
                    {step.score ? (
                      <Badge variant="success" className="gap-1.5">
                        <CheckCircle2 className="size-3.5" />
                        {step.score}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {step.summary}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
