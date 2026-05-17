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
