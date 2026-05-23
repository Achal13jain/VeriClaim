import type { Metadata } from "next";

import { AppWagmiProvider } from "@/components/providers/wagmi-provider";
import { SiteHeader } from "@/components/site-header";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://veri-claim-livid.vercel.app";
const appDescription =
  "Turn messy internet claims into verifiable prediction-market specs using an adversarial AI agent flow.";

export const metadata: Metadata = {
  title: "VeriClaim | Verifiable MarketSpecs",
  description: appDescription,
  metadataBase: new URL(appUrl),
  applicationName: "VeriClaim",
  keywords: [
    "VeriClaim",
    "MarketSpec",
    "prediction markets",
    "Arc",
    "x402",
    "AI agents",
  ],
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "VeriClaim | Verifiable MarketSpecs",
    description: appDescription,
    url: appUrl,
    siteName: "VeriClaim",
    images: [
      {
        url: "/screenshots/home.png",
        width: 1440,
        height: 1000,
        alt: "VeriClaim landing page",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VeriClaim | Verifiable MarketSpecs",
    description: appDescription,
    images: ["/screenshots/home.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppWagmiProvider>
            <SmoothScrollProvider>
              <SiteHeader />
              {children}
            </SmoothScrollProvider>
          </AppWagmiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
