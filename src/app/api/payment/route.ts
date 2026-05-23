import { NextRequest, NextResponse } from "next/server";

import { createMockX402Payment } from "@/lib/payments/mockPayment";
import { PaymentRequestSchema } from "@/lib/payments/types";
import { isMockX402Mode } from "@/lib/payments/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function decodeJwtPayload(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(normalized, "base64").toString("utf8");

    return JSON.parse(decoded) as {
      aud?: string;
      exp?: number;
      sub?: string;
      user_id?: string;
    };
  } catch {
    return null;
  }
}

function getBearerUid(request: NextRequest) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const payload = decodeJwtPayload(header.slice("Bearer ".length));
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (!payload?.exp || payload.exp < nowSeconds) {
    return null;
  }

  return payload.user_id ?? payload.sub ?? null;
}

export async function POST(request: NextRequest) {
  if (!isMockX402Mode()) {
    return NextResponse.json(
      { error: "Only mock x402 mode is enabled in this MVP." },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedRequest = PaymentRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        error: "Invalid payment unlock request.",
        issues: parsedRequest.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const tokenUid = getBearerUid(request);

  if (!tokenUid || tokenUid !== parsedRequest.data.userId) {
    return NextResponse.json(
      { error: "A signed-in Firebase user is required for mock x402 unlocks." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ...createMockX402Payment(parsedRequest.data.userId),
    note: "Mock x402 payment completed. No real money moved.",
  });
}
