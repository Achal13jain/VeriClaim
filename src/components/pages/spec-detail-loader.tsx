"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileQuestion, Loader2 } from "lucide-react";

import { SpecDetailPage } from "@/components/pages/spec-detail-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSpecByHash } from "@/lib/firebase/firestore";
import { mockMarketSpecs } from "@/lib/mock-data";
import type { MarketSpecRecord } from "@/lib/types";

export function SpecDetailLoader({ hash }: { hash: string }) {
  const [spec, setSpec] = useState<MarketSpecRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSpec() {
      setLoading(true);
      setError(null);

      try {
        const savedSpec = await getSpecByHash(hash);
        const fallbackSpec =
          savedSpec ?? mockMarketSpecs.find((item) => item.hash === hash) ?? null;

        if (active) {
          setSpec(fallbackSpec);
        }
      } catch (caughtError) {
        if (active) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not load this MarketSpec.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSpec();

    return () => {
      active = false;
    };
  }, [hash]);

  if (loading) {
    return (
      <main className="page-shell">
        <Card className="glass-panel">
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading public MarketSpec.
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error || !spec) {
    return (
      <main className="page-shell flex min-h-[70vh] flex-col justify-center">
        <Card className="glass-panel max-w-2xl">
          <CardContent className="space-y-4 p-6">
            <FileQuestion className="size-7 text-court-amber" />
            <div>
              <p className="font-semibold">MarketSpec not found</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {error ??
                  "No saved spec exists for this hash yet. Save a generated MarketSpec first to create a public page."}
              </p>
            </div>
            <Button asChild variant="court">
              <Link href="/forge">Forge a MarketSpec</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <SpecDetailPage spec={spec} />;
}
