export interface NumericThreshold {
  raw: string;
  value: string;
  kind: "currency" | "percentage" | "stars" | "users" | "points";
}

function normalizeNumber(value: string) {
  return value.replace(/,/g, "").trim();
}

function normalizeWithSuffix(value: string, suffix?: string) {
  const base = Number(normalizeNumber(value));

  if (!Number.isFinite(base)) {
    return normalizeNumber(value);
  }

  if (suffix?.toLowerCase() === "m") {
    return String(base * 1_000_000);
  }

  if (suffix?.toLowerCase() === "k") {
    return String(base * 1_000);
  }

  return String(base);
}

function uniqueThresholds(thresholds: NumericThreshold[]) {
  const seen = new Set<string>();

  return thresholds.filter((threshold) => {
    const key = `${threshold.kind}:${threshold.value}:${threshold.raw.toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function extractNumericThresholds(claim: string): NumericThreshold[] {
  const thresholds: NumericThreshold[] = [];

  for (const match of claim.matchAll(
    /\$\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\s*(?:USD|USDC|USDT)?/gi,
  )) {
    thresholds.push({
      raw: match[0].replace(/\s+/g, " ").trim(),
      value: normalizeWithSuffix(match[1], match[2]),
      kind: "currency",
    });
  }

  for (const match of claim.matchAll(
    /\b(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\s*(?:USD|USDC|USDT)\b/gi,
  )) {
    thresholds.push({
      raw: match[0].replace(/\s+/g, " ").trim(),
      value: normalizeWithSuffix(match[1], match[2]),
      kind: "currency",
    });
  }

  for (const match of claim.matchAll(
    /\b(\d[\d,]*(?:\.\d+)?)\s*(?:%|\bpercent(?:age)?\b)/gi,
  )) {
    thresholds.push({
      raw: match[0].replace(/\s+/g, " ").trim(),
      value: normalizeNumber(match[1]),
      kind: "percentage",
    });
  }

  for (const match of claim.matchAll(
    /\b(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\s*(?:github\s+)?stars?\b/gi,
  )) {
    thresholds.push({
      raw: match[0].replace(/\s+/g, " ").trim(),
      value: normalizeWithSuffix(match[1], match[2]),
      kind: "stars",
    });
  }

  for (const match of claim.matchAll(
    /\b(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\s*(?:monthly\s+active\s+)?users?\b/gi,
  )) {
    thresholds.push({
      raw: match[0].replace(/\s+/g, " ").trim(),
      value: normalizeWithSuffix(match[1], match[2]),
      kind: "users",
    });
  }

  for (const match of claim.matchAll(
    /\b(\d[\d,]*(?:\.\d+)?)\s*(?:league\s+)?points?\b/gi,
  )) {
    thresholds.push({
      raw: match[0].replace(/\s+/g, " ").trim(),
      value: normalizeNumber(match[1]),
      kind: "points",
    });
  }

  return uniqueThresholds(thresholds);
}

function extractOutputValues(text: string, kind: NumericThreshold["kind"]) {
  const values: string[] = [];

  if (kind === "currency") {
    for (const match of text.matchAll(
      /\$\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\s*(?:USD|USDC|USDT)?/gi,
    )) {
      values.push(normalizeWithSuffix(match[1], match[2]));
    }

    for (const match of text.matchAll(
      /\b(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\s*(?:USD|USDC|USDT)\b/gi,
    )) {
      values.push(normalizeWithSuffix(match[1], match[2]));
    }
  }

  if (kind === "percentage") {
    for (const match of text.matchAll(
      /\b(\d[\d,]*(?:\.\d+)?)\s*(?:%|\bpercent(?:age)?\b)/gi,
    )) {
      values.push(normalizeNumber(match[1]));
    }
  }

  if (kind === "stars") {
    for (const match of text.matchAll(
      /\b(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\s*(?:github\s+)?stars?\b/gi,
    )) {
      values.push(normalizeWithSuffix(match[1], match[2]));
    }
  }

  if (kind === "users") {
    for (const match of text.matchAll(
      /\b(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\s*(?:monthly\s+active\s+)?users?\b/gi,
    )) {
      values.push(normalizeWithSuffix(match[1], match[2]));
    }
  }

  if (kind === "points") {
    for (const match of text.matchAll(
      /\b(\d[\d,]*(?:\.\d+)?)\s*(?:league\s+)?points?\b/gi,
    )) {
      values.push(normalizeNumber(match[1]));
    }
  }

  return values;
}

export function textPreservesThreshold(
  text: string,
  threshold: NumericThreshold,
) {
  return extractOutputValues(text, threshold.kind).includes(threshold.value);
}

export function missingThresholdsInText(
  text: string,
  thresholds: NumericThreshold[],
) {
  return thresholds.filter((threshold) => !textPreservesThreshold(text, threshold));
}

function replaceCurrencyThresholds(text: string, threshold: NumericThreshold) {
  const outputValues = extractOutputValues(text, "currency");

  if (outputValues.includes(threshold.value)) {
    return text;
  }

  return text.replace(
    /\$\s*\d[\d,]*(?:\.\d+)?\s*(?:USD|USDC|USDT)?/gi,
    threshold.raw,
  );
}

function replaceStarThresholds(text: string, threshold: NumericThreshold) {
  const outputValues = extractOutputValues(text, "stars");

  if (outputValues.includes(threshold.value)) {
    return text;
  }

  return text.replace(
    /\b\d[\d,]*(?:\.\d+)?\s*(?:github\s+)?stars?\b/gi,
    threshold.raw,
  );
}

function replacePercentageThresholds(text: string, threshold: NumericThreshold) {
  const outputValues = extractOutputValues(text, "percentage");

  if (outputValues.includes(threshold.value)) {
    return text;
  }

  return text.replace(
    /\b\d[\d,]*(?:\.\d+)?\s*(?:%|\bpercent(?:age)?\b)/gi,
    threshold.raw,
  );
}

function replaceUserThresholds(text: string, threshold: NumericThreshold) {
  const outputValues = extractOutputValues(text, "users");

  if (outputValues.includes(threshold.value)) {
    return text;
  }

  return text.replace(
    /\b\d[\d,]*(?:\.\d+)?\s*(?:k|m)?\s*(?:monthly\s+active\s+)?users?\b/gi,
    threshold.raw,
  );
}

function replacePointThresholds(text: string, threshold: NumericThreshold) {
  const outputValues = extractOutputValues(text, "points");

  if (outputValues.includes(threshold.value)) {
    return text;
  }

  return text.replace(
    /\b\d[\d,]*(?:\.\d+)?\s*(?:league\s+)?points?\b/gi,
    threshold.raw,
  );
}

export function forcePreserveThresholds(
  text: string,
  thresholds: NumericThreshold[],
) {
  return thresholds.reduce((current, threshold) => {
    if (threshold.kind === "currency") {
      return replaceCurrencyThresholds(current, threshold);
    }

    if (threshold.kind === "stars") {
      return replaceStarThresholds(current, threshold);
    }

    if (threshold.kind === "users") {
      return replaceUserThresholds(current, threshold);
    }

    if (threshold.kind === "points") {
      return replacePointThresholds(current, threshold);
    }

    return replacePercentageThresholds(current, threshold);
  }, text);
}
