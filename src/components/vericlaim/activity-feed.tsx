import { Coins, FileCheck2, ShieldCheck, Siren } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActivityEvent } from "@/lib/types";

const iconByType = {
  forge: FileCheck2,
  challenge: Siren,
  proof: ShieldCheck,
  reward: Coins,
};

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Activity feed</CardTitle>
          <Badge variant="glass">live-style mock</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => {
          const Icon = iconByType[event.type];

          return (
            <div key={event.id} className="flex gap-3">
              <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/70 text-court-blue">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{event.title}</p>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {event.timestamp}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {event.detail}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
