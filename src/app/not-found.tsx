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
          The current foundation uses mock public specs only. Live Firestore
          lookup will arrive in a later phase.
        </p>
      </div>
      <Button asChild variant="court">
        <Link href="/specs">Explore mock specs</Link>
      </Button>
    </main>
  );
}
