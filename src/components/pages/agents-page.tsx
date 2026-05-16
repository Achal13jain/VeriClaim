import { AgentCard } from "@/components/vericlaim/agent-card";
import { AgentCourtTimeline } from "@/components/vericlaim/agent-court-timeline";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { featuredSpec, mockAgents } from "@/lib/mock-data";

export function AgentsPage() {
  return (
    <main className="page-shell space-y-8">
      <section className="max-w-4xl space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="blue">REQ-AGENT-001</Badge>
          <Badge variant="violet">ERC-8004 adapter mode</Badge>
        </div>
        <h1 className="font-display text-5xl leading-none sm:text-6xl">
          Agent court.
        </h1>
        <p className="text-muted-foreground">
          The Forger, Critic, and Judge are represented as auditable agent
          identities with role, provider, reputation, validation count, and
          adapter metadata.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {mockAgents.map((agent) => (
          <AgentCard key={agent.agentId} agent={agent} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Identity adapter contract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              This pass shows ERC-8004-aware identity metadata only. Canonical
              standard integration, trust attestations, and on-chain agent
              reputation writes are reserved for later implementation.
            </p>
            <div className="grid gap-3">
              <div className="rounded-md border border-border/70 bg-background/60 p-3">
                identityMode: ERC-8004 adapter
              </div>
              <div className="rounded-md border border-border/70 bg-background/60 p-3">
                providerPolicy: Forger and Critic require different model
                families in live mode
              </div>
              <div className="rounded-md border border-border/70 bg-background/60 p-3">
                fallbackPolicy: missing keys keep the court in deterministic
                demo mode
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Latest court trace</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentCourtTimeline steps={featuredSpec.agentTrace} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
