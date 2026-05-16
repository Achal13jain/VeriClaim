import { notFound } from "next/navigation";

import { SpecDetailPage } from "@/components/pages/spec-detail-page";
import { mockMarketSpecs } from "@/lib/mock-data";

export function generateStaticParams() {
  return mockMarketSpecs.map((spec) => ({
    hash: spec.hash,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const spec = mockMarketSpecs.find((item) => item.hash === hash);

  if (!spec) {
    notFound();
  }

  return <SpecDetailPage spec={spec} />;
}
