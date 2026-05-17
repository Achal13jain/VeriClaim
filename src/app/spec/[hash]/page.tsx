import { SpecDetailLoader } from "@/components/pages/spec-detail-loader";

export default async function Page({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;

  return <SpecDetailLoader hash={hash} />;
}
