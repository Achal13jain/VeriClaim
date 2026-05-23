import type { Metadata } from "next";

import { SpecDetailLoader } from "@/components/pages/spec-detail-loader";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://veri-claim-livid.vercel.app";

function shortHash(hash: string) {
  return hash.length > 18 ? `${hash.slice(0, 10)}...${hash.slice(-6)}` : hash;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }>;
}): Promise<Metadata> {
  const { hash } = await params;
  const title = `MarketSpec ${shortHash(hash)} | VeriClaim`;
  const description =
    "Public VeriClaim MarketSpec page with AI Court trace, challenge status, and Arc-ready proof metadata.";

  return {
    title,
    description,
    alternates: {
      canonical: `/spec/${hash}`,
    },
    openGraph: {
      title,
      description,
      url: `${appUrl.replace(/\/$/, "")}/spec/${hash}`,
      siteName: "VeriClaim",
      images: [
        {
          url: "/screenshots/forge.png",
          width: 1440,
          height: 1000,
          alt: "VeriClaim MarketSpec workflow",
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/screenshots/forge.png"],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;

  return <SpecDetailLoader hash={hash} />;
}
