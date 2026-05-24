export const PUBLIC_DEMO_FALLBACK_WARNING =
  "Live AI providers were unavailable, so VeriClaim used validated fallback mode.";

export const PUBLIC_QUALITY_REPAIR_WARNING =
  "The MarketSpec was normalized by VeriClaim quality guards before rendering.";

const internalErrorPattern =
  /\b(groq|gemini|openai|openrouter|api[_ -]?key|provider|request failed|status\s+\d{3}|failed semantic validation|firebaseerror|permission-denied|insufficient permissions|err_[a-z_]+|blocked_by_client|stack trace)\b/i;

export function getSafeForgeWarning(
  warning: string | null | undefined,
  mode?: "live" | "demo" | string | null,
) {
  if (!warning) {
    return null;
  }

  if (/repair|repaired|normalized|quality guard/i.test(warning)) {
    return PUBLIC_QUALITY_REPAIR_WARNING;
  }

  if (mode === "demo" || /fallback|unavailable|failed/i.test(warning)) {
    return PUBLIC_DEMO_FALLBACK_WARNING;
  }

  return "VeriClaim completed the request with safe fallback handling.";
}

export function toSafeClientError(error: unknown, fallback: string) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (!message.trim()) {
    return fallback;
  }

  if (internalErrorPattern.test(message)) {
    return fallback;
  }

  return message;
}
