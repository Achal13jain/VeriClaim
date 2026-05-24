import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="page-shell flex min-h-[70vh] flex-col items-start justify-center gap-6">
      <div className="max-w-2xl space-y-4">
        <p className="section-eyebrow">Spec not found</p>
        <h1 className="font-display text-5xl leading-none">
          This MarketSpec is outside the court record.
        </h1>
        <p className="text-muted-foreground">
          This public MarketSpec could not be found in Firestore. Explore the
          gallery or forge a new spec to create a shareable proof page.
        </p>
      </div>
      <Button asChild variant="court">
        <Link href="/specs">Explore specs</Link>
      </Button>
    </main>
  );
}
