"use client";

import { useMemo, useState } from "react";
import { Filter, ListFilter, SlidersHorizontal } from "lucide-react";

import { MarketSpecCard } from "@/components/vericlaim/market-spec-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockMarketSpecs } from "@/lib/mock-data";
import type { MarketSpecStatus } from "@/lib/types";

type StatusFilter = "all" | MarketSpecStatus;
type SortMode = "newest" | "quality" | "challenged" | "rewarded";

const statuses: StatusFilter[] = [
  "all",
  "published",
  "blessed",
  "challenged",
  "needs_revision",
  "rejected",
];

const categories = [
  "all",
  ...Array.from(new Set(mockMarketSpecs.map((spec) => spec.marketSpec.category))),
];

const sortModes: Array<{ value: SortMode; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "quality", label: "Quality score" },
  { value: "challenged", label: "Most challenged" },
  { value: "rewarded", label: "Most rewarded" },
];

export function SpecGalleryPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const specs = useMemo(() => {
    const filtered = mockMarketSpecs.filter((spec) => {
      const statusMatch = status === "all" || spec.status === status;
      const categoryMatch =
        category === "all" || spec.marketSpec.category === category;

      return statusMatch && categoryMatch;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "quality") {
        return b.scores.quality - a.scores.quality;
      }
      if (sortMode === "challenged") {
        return b.challengeCount - a.challengeCount;
      }
      if (sortMode === "rewarded") {
        return b.rewardTotal - a.rewardTotal;
      }

      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [category, sortMode, status]);

  return (
    <main className="page-shell space-y-8">
      <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="blue">REQ-GALLERY-001</Badge>
            <Badge variant="glass">public mock specs</Badge>
          </div>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">
            Spec gallery.
          </h1>
          <p className="text-muted-foreground">
            Browse public MarketSpecs by status, category, challenge activity,
            quality, and rewards. The records are static mock data in this pass.
          </p>
        </div>
        <Badge variant="success">{specs.length} specs visible</Badge>
      </section>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-5 text-court-blue" />
            Gallery controls
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Filter className="size-4" />
              Status
            </label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as StatusFilter)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item === "all" ? "All statuses" : item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <ListFilter className="size-4" />
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item === "all" ? "All categories" : item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="size-4" />
              Sort
            </label>
            <Select
              value={sortMode}
              onValueChange={(value) => setSortMode(value as SortMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortModes.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-5 lg:grid-cols-3">
        {specs.map((spec) => (
          <MarketSpecCard key={spec.hash} spec={spec} />
        ))}
      </section>
    </main>
  );
}
