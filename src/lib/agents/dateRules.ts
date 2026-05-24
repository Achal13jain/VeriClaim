export interface ReferenceDateContext {
  referenceDate: string;
  currentYear: number;
  nextYear: number;
  currentYearEnd: string;
  nextYearEnd: string;
  currentMonthEnd: string;
  nextMonthEnd: string;
  beforeQ4CurrentYear: string;
}

export interface ExplicitDeadline {
  deadline: string;
  display: string;
  matchedText: string;
  reason: string;
}

const monthIndexByName: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function utcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

function lastDayOfMonth(year: number, monthIndex: number) {
  return utcDate(year, monthIndex + 1, 0);
}

function addMonths(date: Date, months: number) {
  return utcDate(date.getUTCFullYear(), date.getUTCMonth() + months, 1);
}

export function getReferenceDateContext(referenceDate = new Date()): ReferenceDateContext {
  const currentYear = referenceDate.getUTCFullYear();
  const nextYear = currentYear + 1;
  const currentMonth = referenceDate.getUTCMonth();
  const nextMonth = addMonths(referenceDate, 1);

  return {
    referenceDate: toIsoDate(referenceDate),
    currentYear,
    nextYear,
    currentYearEnd: `${currentYear}-12-31`,
    nextYearEnd: `${nextYear}-12-31`,
    currentMonthEnd: toIsoDate(lastDayOfMonth(currentYear, currentMonth)),
    nextMonthEnd: toIsoDate(
      lastDayOfMonth(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth()),
    ),
    beforeQ4CurrentYear: `${currentYear}-10-01`,
  };
}

export function longDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function validIsoFromParts(year: number, month: number, day: number) {
  const date = utcDate(year, month - 1, day);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return toIsoDate(date);
}

function explicitDeadlineResult(deadline: string, matchedText: string) {
  return {
    deadline,
    display: longDate(deadline),
    matchedText: matchedText.trim(),
    reason: `The claim contains an explicit deadline "${matchedText.trim()}", so the MarketSpec deadline must be ${deadline}.`,
  } satisfies ExplicitDeadline;
}

export function extractExplicitDeadline(claim: string): ExplicitDeadline | null {
  const deadlinePrefix =
    String.raw`\b(?:before|by|until|through|no later than|on or before|deadline(?:\s+is|\s*:)?|settles?\s+by)\s+`;
  const isoMatch = claim.match(
    new RegExp(`${deadlinePrefix}(\\d{4})-(\\d{1,2})-(\\d{1,2})\\b`, "i"),
  );

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const deadline = validIsoFromParts(year, month, day);

    if (deadline) {
      return explicitDeadlineResult(deadline, isoMatch[0]);
    }
  }

  const monthNamePattern =
    String.raw`(jan(?:uary)?\.?|feb(?:ruary)?\.?|mar(?:ch)?\.?|apr(?:il)?\.?|may|jun(?:e)?\.?|jul(?:y)?\.?|aug(?:ust)?\.?|sep(?:t(?:ember)?|tember)?\.?|oct(?:ober)?\.?|nov(?:ember)?\.?|dec(?:ember)?\.?)`;
  const namedDateMatch = claim.match(
    new RegExp(
      `${deadlinePrefix}${monthNamePattern}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*,?\\s*(\\d{4})\\b`,
      "i",
    ),
  );

  if (namedDateMatch) {
    const normalizedMonth = namedDateMatch[1]
      .toLowerCase()
      .replace(/\.$/, "")
      .slice(0, 3);
    const monthIndex = monthIndexByName[normalizedMonth];
    const day = Number(namedDateMatch[2]);
    const year = Number(namedDateMatch[3]);

    if (monthIndex !== undefined) {
      const deadline = validIsoFromParts(year, monthIndex + 1, day);

      if (deadline) {
        return explicitDeadlineResult(deadline, namedDateMatch[0]);
      }
    }
  }

  return null;
}

export function inferRelativeDeadline(
  claim: string,
  referenceDate = new Date(),
) {
  const lower = claim.toLowerCase();
  const context = getReferenceDateContext(referenceDate);

  if (/\b(this year|year[- ]end|end of year)\b/i.test(lower)) {
    return {
      deadline: context.currentYearEnd,
      reason: `"this year" resolves to December 31, ${context.currentYear}`,
    };
  }

  if (/\bnext year\b/i.test(lower)) {
    return {
      deadline: context.nextYearEnd,
      reason: `"next year" resolves to December 31, ${context.nextYear}`,
    };
  }

  if (/\bthis month\b/i.test(lower)) {
    return {
      deadline: context.currentMonthEnd,
      reason: `"this month" resolves to the last day of the current month`,
    };
  }

  if (/\bnext month\b/i.test(lower)) {
    return {
      deadline: context.nextMonthEnd,
      reason: `"next month" resolves to the last day of the next month`,
    };
  }

  if (/\bbefore\s+q4\b/i.test(lower)) {
    let deadline = context.beforeQ4CurrentYear;

    if (deadline < context.referenceDate) {
      deadline = `${context.nextYear}-10-01`;
    }

    return {
      deadline,
      reason: `"before Q4" resolves to before October 1 of the relevant year`,
    };
  }

  return null;
}

export function fallbackFutureDeadline(referenceDate = new Date()) {
  const deadline = new Date(referenceDate);
  deadline.setUTCMonth(deadline.getUTCMonth() + 5);
  return toIsoDate(deadline);
}

export function isIsoDateBefore(date: string, minDate: string) {
  return date < minDate;
}
