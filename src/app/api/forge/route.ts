import { NextRequest, NextResponse } from "next/server";

import { forgeClaim } from "@/lib/agents/forgeClaim";
import { ForgeRequestSchema } from "@/lib/agents/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function safeHeaderValue(value: string) {
  return value.replace(/[^\t\x20-\x7e\x80-\xff]+/g, " ").slice(0, 500);
}

function getClientId(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") ?? "local-dev";
}

function checkRateLimit(request: NextRequest) {
  const clientId = getClientId(request);
  const now = Date.now();
  const bucket = rateLimitBuckets.get(clientId);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - bucket.count };
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          "Forge rate limit reached. Please wait before running the AI Court again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter ?? 60),
        },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedRequest = ForgeRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        error: "Invalid forge request.",
        issues: parsedRequest.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const result = await forgeClaim(parsedRequest.data);

  const headers: Record<string, string> = {
    "x-vericlaim-mode": result.mode,
    "x-ratelimit-remaining": String(rateLimit.remaining),
  };

  if (result.warning) {
    headers["x-vericlaim-warning"] = safeHeaderValue(result.warning);
  }

  return NextResponse.json(result.response, { headers });
}
