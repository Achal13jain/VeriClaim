"use client";

import { useEffect, useMemo, useState } from "react";
import { FileSearch, Filter, ListFilter, Loader2, SlidersHorizontal } from "lucide-react";

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
import { firebaseReady, listPublicSpecs } from "@/lib/firebase/firestore";
import type { MarketSpecRecord, MarketSpecStatus } from "@/lib/types";

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
  const [allSpecs, setAllSpecs] = useState<MarketSpecRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSpecs() {
      setLoading(true);
      setLoadError(null);

      try {
        const specs = await listPublicSpecs();

        if (active) {
          setAllSpecs(specs);
        }
      } catch (caughtError) {
        if (active) {
          setLoadError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not load public specs.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSpecs();

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => [
      "all",
      ...Array.from(new Set(allSpecs.map((spec) => spec.marketSpec.category))),
    ],
    [allSpecs],
  );

  const specs = useMemo(() => {
    const filtered = allSpecs.filter((spec) => {
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
  }, [allSpecs, category, sortMode, status]);

  return (
    <main className="page-shell space-y-8">
      <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="blue">REQ-GALLERY-001</Badge>
            <Badge variant="glass">
              {firebaseReady() ? "Firestore public specs" : "Firebase not configured"}
            </Badge>
          </div>
          <h1 className="font-display text-5xl leading-none sm:text-6xl">
            Spec gallery.
          </h1>
          <p className="text-muted-foreground">
            Browse public MarketSpecs by status, category, challenge activity,
            quality, and rewards. Saved specs are loaded from Firestore newest
            first.
          </p>
        </div>
        <Badge variant="success">
          {loading ? "Loading specs" : `${specs.length} specs visible`}
        </Badge>
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

      {loading ? (
        <Card className="glass-panel">
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading public MarketSpecs from Firestore.
          </CardContent>
        </Card>
      ) : loadError ? (
        <Card className="glass-panel">
          <CardContent className="p-6 text-sm text-destructive">
            {loadError}
          </CardContent>
        </Card>
      ) : specs.length === 0 ? (
        <Card className="glass-panel">
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <FileSearch className="size-6 text-court-blue" />
            <div>
              <p className="font-semibold">No saved specs yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Forge and save a MarketSpec to make it appear in the public
                gallery.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-5 lg:grid-cols-3">
          {specs.map((spec) => (
            <MarketSpecCard key={spec.hash} spec={spec} />
          ))}
        </section>
      )}
    </main>
  );
}
