"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  BadgeCheck,
  FileJson2,
  Gavel,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AgentCourtTimeline } from "@/components/vericlaim/agent-court-timeline";
import { ArcProofBadge } from "@/components/vericlaim/arc-proof-badge";
import { JSONPreview } from "@/components/vericlaim/json-preview";
import { MarketSpecCard } from "@/components/vericlaim/market-spec-card";
import { ReputationBadge } from "@/components/vericlaim/reputation-badge";
import { SampleClaimChips } from "@/components/vericlaim/sample-claim-chips";
import { X402PaymentBadge } from "@/components/vericlaim/x402-payment-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { featuredSpec, mockAgents, mockMarketSpecs } from "@/lib/mock-data";

const marketSpecJson = {
  source_claim: featuredSpec.sourceClaim,
  canonical_claim: featuredSpec.canonicalClaim,
  market_spec: {
    question: featuredSpec.marketSpec.question,
    outcomes: featuredSpec.marketSpec.outcomes,
    deadline: featuredSpec.marketSpec.deadline,
    resolution_source: featuredSpec.marketSpec.resolutionSource,
    resolution_rule: featuredSpec.marketSpec.resolutionRule,
    edge_cases: featuredSpec.marketSpec.edgeCases,
  },
  scores: featuredSpec.scores,
};

export function LandingPage() {
  const courtRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!courtRef.current) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ".court-pin",
        start: "top 82px",
        end: "+=760",
        pin: true,
        scrub: true,
      });

      gsap.fromTo(
        ".court-step-card",
        { opacity: 0.42, y: 28 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.18,
          scrollTrigger: {
            trigger: ".court-pin",
            start: "top center",
            end: "+=640",
            scrub: true,
          },
        },
      );
    }, courtRef);

    return () => ctx.revert();
  }, []);

  return (
    <main>
      <section className="relative min-h-[82svh] overflow-hidden border-b border-border/70">
        <div className="absolute inset-0 bg-court-grid bg-[size:54px_54px]" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 border-t border-sky-400/20 bg-[linear-gradient(to_top,rgba(57,167,255,0.10),transparent)]" />
        <div className="absolute bottom-0 left-1/2 h-44 w-[min(900px,90vw)] -translate-x-1/2 rounded-t-lg border border-court-blue/25 bg-background/50 backdrop-blur-sm" />
        <div className="absolute bottom-8 left-1/2 grid w-[min(760px,84vw)] -translate-x-1/2 grid-cols-3 gap-4 opacity-80">
          {mockAgents.map((agent) => (
            <div
              key={agent.agentId}
              className="court-scan hidden min-h-28 rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-xl sm:block"
            >
              <div className="font-mono text-xs text-muted-foreground">
                {agent.role}
              </div>
              <div className="mt-2 font-semibold">{agent.name}</div>
              <div className="mt-4 h-1.5 rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-court-green"
                  style={{ width: `${agent.winRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 mx-auto flex min-h-[82svh] w-full max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-5xl"
          >
            <div className="mb-6 flex flex-wrap gap-2">
              <Badge variant="blue" className="gap-1.5">
                <Sparkles className="size-3.5" />
                AI Court
              </Badge>
              <ArcProofBadge
                published={featuredSpec.arcPublished}
                txHash={featuredSpec.arcTxHash}
              />
              <X402PaymentBadge />
            </div>
            <h1 className="max-w-4xl font-display text-6xl leading-[0.92] sm:text-7xl lg:text-8xl">
              Turn claims into verifiable markets.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
              VeriClaim uses adversarial AI agents to forge, critique, and
              validate prediction-market specs — then anchors proof on Arc.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="court" size="lg">
                <Link href="/forge">
                  Forge a MarketSpec
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link href="/specs">Explore Specs</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="glass">No betting</Badge>
              <Badge variant="glass">No trading</Badge>
              <Badge variant="glass">No financial advice</Badge>
              <Badge variant="glass">Demo fallback ready</Badge>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="page-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-6">
          <p className="section-eyebrow">Messy input to proof-ready spec</p>
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">
            The court turns vague claims into settlement-grade JSON.
          </h2>
          <p className="text-muted-foreground">
            The foundation ships with deterministic mock data, so every screen
            stays demoable while live AI, Firebase, Arc, and x402 adapters are
            added in later passes.
          </p>
          <SampleClaimChips />
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="glass-panel">
              <CardContent className="p-4">
                <Gavel className="mb-3 size-5 text-court-blue" />
                <p className="font-semibold">Forger</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Creates the first MarketSpec.
                </p>
              </CardContent>
            </Card>
            <Card className="glass-panel">
              <CardContent className="p-4">
                <FileJson2 className="mb-3 size-5 text-court-amber" />
                <p className="font-semibold">Critic</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Attacks ambiguity and edge cases.
                </p>
              </CardContent>
            </Card>
            <Card className="glass-panel">
              <CardContent className="p-4">
                <BadgeCheck className="mb-3 size-5 text-court-green" />
                <p className="font-semibold">Judge</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Blesses, revises, or rejects.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="grid gap-4">
          <MarketSpecCard spec={featuredSpec} compact />
          <JSONPreview data={marketSpecJson} />
        </div>
      </section>

      <section ref={courtRef} className="border-y border-border/70 bg-card/40">
        <div className="page-shell">
          <div className="court-pin grid min-h-[72vh] gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="space-y-5">
              <p className="section-eyebrow">AI Court</p>
              <h2 className="font-display text-4xl leading-tight sm:text-5xl">
                Forged, challenged, ruled, anchored.
              </h2>
              <p className="text-muted-foreground">
                The visual workflow mirrors the SRS court pipeline: Forger,
                Critic, Judge, then Arc proof and reputation feedback.
              </p>
              <div className="flex flex-wrap gap-2">
                <ReputationBadge reputation={2839} label="Court rep" />
                <Badge variant="blue" className="gap-1.5">
                  <ShieldCheck className="size-3.5" />
                  Arc testnet ready
                </Badge>
              </div>
            </div>
            <div className="space-y-4">
              <div className="court-step-card">
                <AgentCourtTimeline steps={featuredSpec.agentTrace} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="section-eyebrow">Public proof pages</p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              Browse market specs that are built to be challenged.
            </h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/specs">
              Open gallery
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {mockMarketSpecs.map((spec) => (
            <MarketSpecCard key={spec.hash} spec={spec} compact />
          ))}
        </div>
      </section>
    </main>
  );
}
