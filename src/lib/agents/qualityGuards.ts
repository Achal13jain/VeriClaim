import {
  appendEntityListsToResolutionRule,
  extractLongParentheticalEntityLists,
  hasLongParentheticalEntityList,
  stripLongParentheticalEntityLists,
} from "@/lib/agents/questionReadability";
import {
  extractExplicitDeadline,
  getReferenceDateContext,
  inferRelativeDeadline,
  longDate,
  type ExplicitDeadline,
} from "@/lib/agents/dateRules";
import {
  extractNumericThresholds,
  forcePreserveThresholds,
  missingThresholdsInText,
} from "@/lib/agents/thresholds";
import {
  ForgeResponseSchema,
  type ForgeRequest,
  type ForgeResponse,
} from "@/lib/agents/schemas";

export type MarketSpecQualityIssueCode =
  | "missing_question"
  | "missing_deadline"
  | "invalid_deadline"
  | "past_deadline"
  | "explicit_deadline_mismatch"
  | "relative_deadline_mismatch"
  | "deadline_not_visible"
  | "numeric_threshold_mismatch"
  | "missing_resolution_source"
  | "missing_resolution_rule"
  | "non_binary_outcomes"
  | "question_too_long"
  | "long_parenthetical_list"
  | "irrelevant_critic_objection"
  | "quality_zero_on_repairable_claim"
  | "score_range_mismatch"
  | "vague_claim_overconfident";

export interface MarketSpecQualityIssue {
  code: MarketSpecQualityIssueCode;
  message: string;
  severity: "error" | "warning";
  fixable: boolean;
}

export interface MarketSpecQualityResult {
  passed: boolean;
  issues: MarketSpecQualityIssue[];
  errors: MarketSpecQualityIssue[];
  warnings: MarketSpecQualityIssue[];
  correctionFeedback: string;
}

function addIssue(
  issues: MarketSpecQualityIssue[],
  issue: MarketSpecQualityIssue,
) {
  if (
    issues.some(
      (existing) =>
        existing.code === issue.code && existing.message === issue.message,
    )
  ) {
    return;
  }

  issues.push(issue);
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
}

function isDeadlineBeforeReference(deadline: string, referenceDate: Date) {
  return deadline < getReferenceDateContext(referenceDate).referenceDate;
}

function finalQuestion(response: ForgeResponse) {
  return response.judge.final_question.trim() || response.market_spec.question;
}

function finalResolutionRule(response: ForgeResponse) {
  return (
    response.judge.final_resolution_rule.trim() ||
    response.market_spec.resolution_rule
  );
}

function isMeaningfulResolutionRule(rule: string) {
  const trimmed = rule.trim();

  return (
    trimmed.length >= 30 &&
    !/^(n\/?a|none|not applicable|rejected|no resolution rule)$/i.test(trimmed)
  );
}

function isPriceRelatedClaim(claim: string) {
  return (
    /\b(bitcoin|btc|ethereum|eth|solana|sol|price|usd|usdc|usdt)\b/i.test(
      claim,
    ) &&
    /\b(reach|exceed|hit|cross|above|below|price|trade)\b/i.test(claim)
  );
}

function isResolvableFutureClaim(claim: string) {
  return /\b(will|before|by|release|announce|launch|reach|cut|become|win|enter|publish|ship|open|close)\b/i.test(
    claim,
  );
}

function isClearlyVagueClaim(claim: string) {
  return (
    /\bmoon soon\b/i.test(claim) ||
    /\bai will replace developers\b/i.test(claim) ||
    /\bmarket will crash\b/i.test(claim) ||
    /\bbig company\b.+\bsomething\b/i.test(claim) ||
    /\bcrypto\b.+\bmainstream\b/i.test(claim)
  );
}

function hasStructuredResolution(
  response: ForgeResponse,
  referenceDate = new Date(),
) {
  return (
    Boolean(finalQuestion(response).trim()) &&
    Boolean(response.market_spec.resolution_source.trim()) &&
    isMeaningfulResolutionRule(finalResolutionRule(response)) &&
    isValidIsoDate(response.market_spec.deadline) &&
    !isDeadlineBeforeReference(response.market_spec.deadline, referenceDate)
  );
}

function scoreRangeIssueMessage(verdict: ForgeResponse["judge"]["verdict"]) {
  if (verdict === "blessed") {
    return "blessed MarketSpecs must use quality 80-95.";
  }

  if (verdict === "needs_revision") {
    return "needs_revision MarketSpecs must use quality 55-79.";
  }

  return "rejected-but-structured MarketSpecs should usually use quality 30-50.";
}

function deadlineIsVisible(question: string, deadline: string) {
  return question.includes(deadline) || question.includes(longDate(deadline));
}

function criticHasStaleDeadlineObjection(
  response: ForgeResponse,
  referenceDate: Date,
) {
  if (
    !isValidIsoDate(response.market_spec.deadline) ||
    isDeadlineBeforeReference(response.market_spec.deadline, referenceDate)
  ) {
    return false;
  }

  return response.critic.objections.some((objection) =>
    /\b(before the reference date|before reference date|deadline is before|deadline is set before|past deadline)\b/i.test(
      objection,
    ),
  );
}

export function validateMarketSpecQuality(
  input: ForgeRequest,
  response: ForgeResponse,
  referenceDate = new Date(),
): MarketSpecQualityResult {
  const issues: MarketSpecQualityIssue[] = [];
  const question = finalQuestion(response);
  const rule = finalResolutionRule(response);
  const deadline = response.market_spec.deadline;
  const explicitDeadline = extractExplicitDeadline(input.claim);
  const relativeDeadline = inferRelativeDeadline(input.claim, referenceDate);
  const thresholds = extractNumericThresholds(input.claim);

  if (!question.trim()) {
    addIssue(issues, {
      code: "missing_question",
      message: "final question is missing.",
      severity: "error",
      fixable: false,
    });
  }

  if (!deadline.trim()) {
    addIssue(issues, {
      code: "missing_deadline",
      message: "market_spec.deadline is missing.",
      severity: "error",
      fixable: false,
    });
  } else if (!isValidIsoDate(deadline)) {
    addIssue(issues, {
      code: "invalid_deadline",
      message: "market_spec.deadline must be a valid YYYY-MM-DD date.",
      severity: "error",
      fixable: false,
    });
  } else if (isDeadlineBeforeReference(deadline, referenceDate)) {
    addIssue(issues, {
      code: "past_deadline",
      message: `market_spec.deadline ${deadline} is before the reference date ${getReferenceDateContext(referenceDate).referenceDate}.`,
      severity: "error",
      fixable: true,
    });
  }

  if (explicitDeadline && deadline !== explicitDeadline.deadline) {
    addIssue(issues, {
      code: "explicit_deadline_mismatch",
      message: `${explicitDeadline.reason}; got ${deadline}.`,
      severity: "error",
      fixable: true,
    });
  }

  if (!explicitDeadline && relativeDeadline && deadline !== relativeDeadline.deadline) {
    addIssue(issues, {
      code: "relative_deadline_mismatch",
      message: `${relativeDeadline.reason}; got ${deadline}.`,
      severity: "error",
      fixable: true,
    });
  }

  if (
    isValidIsoDate(deadline) &&
    !deadlineIsVisible(question, deadline)
  ) {
    addIssue(issues, {
      code: "deadline_not_visible",
      message: `final question must visibly preserve the deadline ${longDate(deadline)}.`,
      severity: "error",
      fixable: true,
    });
  }

  if (thresholds.length > 0) {
    const questionText = `${response.market_spec.question} ${response.judge.final_question}`;
    const ruleText = `${response.market_spec.resolution_rule} ${response.judge.final_resolution_rule}`;
    const missingFromQuestion = missingThresholdsInText(
      questionText,
      thresholds,
    );
    const missingFromRule = missingThresholdsInText(ruleText, thresholds);

    if (missingFromQuestion.length > 0 || missingFromRule.length > 0) {
      addIssue(issues, {
        code: "numeric_threshold_mismatch",
        message: `numeric thresholds must be preserved exactly in question and rule: ${[
          ...missingFromQuestion,
          ...missingFromRule,
        ]
          .map((threshold) => threshold.raw)
          .filter((value, index, values) => values.indexOf(value) === index)
          .join(", ")}.`,
        severity: "error",
        fixable: true,
      });
    }
  }

  if (!response.market_spec.resolution_source.trim()) {
    addIssue(issues, {
      code: "missing_resolution_source",
      message: "resolution source is missing.",
      severity: "error",
      fixable: false,
    });
  }

  if (!isMeaningfulResolutionRule(rule)) {
    addIssue(issues, {
      code: "missing_resolution_rule",
      message: "resolution rule is missing or not meaningful.",
      severity: "error",
      fixable: false,
    });
  }

  if (
    response.market_spec.outcomes.length !== 2 ||
    response.market_spec.outcomes[0] !== "YES" ||
    response.market_spec.outcomes[1] !== "NO"
  ) {
    addIssue(issues, {
      code: "non_binary_outcomes",
      message: "market_spec.outcomes must be exactly [\"YES\", \"NO\"].",
      severity: "error",
      fixable: true,
    });
  }

  if (question.length > 220) {
    addIssue(issues, {
      code: "question_too_long",
      message: "final question must be 220 characters or shorter.",
      severity: "error",
      fixable: true,
    });
  }

  if (
    hasLongParentheticalEntityList(response.market_spec.question) ||
    hasLongParentheticalEntityList(response.judge.final_question)
  ) {
    addIssue(issues, {
      code: "long_parenthetical_list",
      message:
        "final question must not include long parenthetical entity lists; define entities in the resolution rule or edge cases.",
      severity: "error",
      fixable: true,
    });
  }

  const outputText = `${question} ${rule} ${response.critic.objections.join(" ")}`;
  if (!isPriceRelatedClaim(input.claim) && /\bintra[- ]?day high\b/i.test(outputText)) {
    addIssue(issues, {
      code: "irrelevant_critic_objection",
      message:
        'non-price claims must not mention stale price-market concepts such as "intra-day high".',
      severity: "error",
      fixable: true,
    });
  }

  if (criticHasStaleDeadlineObjection(response, referenceDate)) {
    addIssue(issues, {
      code: "irrelevant_critic_objection",
      message:
        "critic objections include a false past-deadline warning for a valid future deadline.",
      severity: "error",
      fixable: true,
    });
  }

  const structured = hasStructuredResolution(response, referenceDate);
  if (response.scores.quality === 0 && structured) {
    addIssue(issues, {
      code: "quality_zero_on_repairable_claim",
      message:
        "quality score must not be 0 for a structured, repairable MarketSpec.",
      severity: "error",
      fixable: true,
    });
  }

  const verdict = response.judge.verdict;
  const quality = response.scores.quality;
  const scoreOutOfRange =
    (verdict === "blessed" && (quality < 80 || quality > 95)) ||
    (verdict === "needs_revision" && (quality < 55 || quality > 79)) ||
    (verdict === "rejected" && structured && (quality < 30 || quality > 50));

  if (scoreOutOfRange) {
    addIssue(issues, {
      code: "score_range_mismatch",
      message: scoreRangeIssueMessage(verdict),
      severity: "error",
      fixable: true,
    });
  }

  if (isClearlyVagueClaim(input.claim) && quality > 60) {
    addIssue(issues, {
      code: "vague_claim_overconfident",
      message:
        "vague claims should not receive high quality scores or appear publication-ready.",
      severity: "warning",
      fixable: true,
    });
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const correctionFeedback = issues
    .map((issue) => `- ${issue.message}`)
    .join("\n");

  return {
    passed: errors.length === 0,
    issues,
    errors,
    warnings,
    correctionFeedback,
  };
}

function replaceDeadlineText(
  text: string,
  previousDeadline: string,
  targetDeadline: ExplicitDeadline,
) {
  let nextText = text.replaceAll(previousDeadline, targetDeadline.deadline);

  if (isValidIsoDate(previousDeadline)) {
    nextText = nextText.replaceAll(longDate(previousDeadline), targetDeadline.display);
  }

  return nextText;
}

function ensureDeadlineVisible(text: string, deadline: string) {
  const display = longDate(deadline);

  if (text.includes(display)) {
    return text;
  }

  if (text.includes(deadline)) {
    return text.replaceAll(deadline, display);
  }

  if (/\?$/.test(text.trim())) {
    return text.trim().replace(/\?$/, ` before ${display}?`);
  }

  return `${text.trim()} before ${display}`;
}

function forceDeadline(
  response: ForgeResponse,
  deadline: string,
  display = longDate(deadline),
) {
  const previousDeadline = response.market_spec.deadline;
  const target = {
    deadline,
    display,
    matchedText: display,
    reason: `The MarketSpec deadline must be ${deadline}.`,
  } satisfies ExplicitDeadline;
  const question = ensureDeadlineVisible(
    replaceDeadlineText(response.market_spec.question, previousDeadline, target),
    deadline,
  );
  const finalQuestion = ensureDeadlineVisible(
    replaceDeadlineText(response.judge.final_question, previousDeadline, target),
    deadline,
  );

  return ForgeResponseSchema.parse({
    ...response,
    market_spec: {
      ...response.market_spec,
      deadline,
      question,
      resolution_rule: replaceDeadlineText(
        response.market_spec.resolution_rule,
        previousDeadline,
        target,
      ),
    },
    judge: {
      ...response.judge,
      final_question: finalQuestion,
      final_resolution_rule: replaceDeadlineText(
        response.judge.final_resolution_rule,
        previousDeadline,
        target,
      ),
      reasoning: [
        ...response.judge.reasoning,
        `Deadline normalized to ${display}.`,
      ],
    },
  });
}

function clampScore(value: number, min: number, max: number, fallback: number) {
  const score = Number.isFinite(value) ? value : fallback;
  return Math.round(Math.min(max, Math.max(min, score)));
}

function normalizeScoreRanges(
  input: ForgeRequest,
  response: ForgeResponse,
  referenceDate = new Date(),
) {
  const structured = hasStructuredResolution(response, referenceDate);
  const vagueClaim = isClearlyVagueClaim(input.claim);
  const repairableFutureRejection =
    response.judge.verdict === "rejected" &&
    structured &&
    isResolvableFutureClaim(input.claim) &&
    !vagueClaim;
  const verdict = repairableFutureRejection
    ? "needs_revision"
    : response.judge.verdict;
  const scores = { ...response.scores };

  if (vagueClaim) {
    scores.quality =
      verdict === "rejected"
        ? clampScore(scores.quality, 30, 50, 38)
        : clampScore(scores.quality, 55, 60, 55);
    scores.tradability = clampScore(scores.tradability, 20, 55, 35);
    scores.resolution_clarity = clampScore(scores.resolution_clarity, 20, 55, 35);
    scores.ambiguity = clampScore(scores.ambiguity, 75, 95, 85);
  } else if (verdict === "blessed") {
    scores.quality = clampScore(scores.quality, 80, 95, 88);
    scores.tradability = clampScore(scores.tradability, 70, 95, 82);
    scores.resolution_clarity = clampScore(scores.resolution_clarity, 75, 95, 86);
  } else if (verdict === "needs_revision") {
    scores.quality = clampScore(scores.quality, 55, 79, 68);
    scores.tradability = clampScore(scores.tradability, 45, 85, 62);
    scores.resolution_clarity = clampScore(scores.resolution_clarity, 45, 85, 66);
  } else {
    scores.quality = structured
      ? clampScore(scores.quality, 30, 50, 40)
      : clampScore(scores.quality, 0, 25, 15);
  }

  const reasoning = repairableFutureRejection
    ? [
        ...response.judge.reasoning,
        "The future claim is structurally resolvable, so it should be revised instead of rejected.",
      ]
    : response.judge.reasoning;

  return ForgeResponseSchema.parse({
    ...response,
    critic: {
      ...response.critic,
      ambiguity_risk: vagueClaim ? "high" : response.critic.ambiguity_risk,
    },
    judge: {
      ...response.judge,
      verdict,
      reasoning,
    },
    scores,
  });
}

function removeIrrelevantObjections(
  input: ForgeRequest,
  response: ForgeResponse,
  referenceDate = new Date(),
) {
  const priceClaim = isPriceRelatedClaim(input.claim);
  const deadlineValid =
    isValidIsoDate(response.market_spec.deadline) &&
    !isDeadlineBeforeReference(response.market_spec.deadline, referenceDate);

  function isIrrelevant(text: string) {
    const lower = text.toLowerCase();

    if (!priceClaim && lower.includes("intra-day high")) {
      return true;
    }

    if (
      deadlineValid &&
      (lower.includes("before the reference date") ||
        lower.includes("before reference date") ||
        lower.includes("deadline is before") ||
        lower.includes("deadline is set before") ||
        lower.includes("past deadline"))
    ) {
      return true;
    }

    return false;
  }

  const objections = response.critic.objections.filter(
    (objection) => !isIrrelevant(objection),
  );
  const suggestedFixes = response.critic.suggested_fixes.filter(
    (fix) => !isIrrelevant(fix),
  );

  return ForgeResponseSchema.parse({
    ...response,
    critic: {
      ...response.critic,
      objections:
        objections.length > 0
          ? objections
          : ["Review source specificity and edge cases before publication."],
      suggested_fixes:
        suggestedFixes.length > 0
          ? suggestedFixes
          : ["Keep the named resolution source, deadline, and qualifying criteria explicit."],
    },
  });
}

function repairQuestionReadability(input: ForgeRequest, response: ForgeResponse) {
  const entityLists = Array.from(
    new Set([
      ...extractLongParentheticalEntityLists(input.claim),
      ...extractLongParentheticalEntityLists(response.market_spec.question),
      ...extractLongParentheticalEntityLists(response.judge.final_question),
    ]),
  );

  let question = response.market_spec.question;
  let finalQuestionValue = response.judge.final_question;

  if (
    finalQuestionValue &&
    finalQuestionValue.length < question.length &&
    finalQuestionValue.length <= 220
  ) {
    question = finalQuestionValue;
  }

  if (entityLists.length > 0) {
    question = stripLongParentheticalEntityLists(question);
    finalQuestionValue = stripLongParentheticalEntityLists(finalQuestionValue);
  }

  const resolutionRule = appendEntityListsToResolutionRule(
    response.market_spec.resolution_rule,
    entityLists,
  );
  const finalResolutionRule = appendEntityListsToResolutionRule(
    response.judge.final_resolution_rule,
    entityLists,
  );
  const edgeCases = [
    ...response.market_spec.edge_cases,
    ...entityLists
      .map((list) => `Qualifying entity list for this market: ${list}.`)
      .filter(
        (edgeCase) => !response.market_spec.edge_cases.includes(edgeCase),
      ),
  ];

  return ForgeResponseSchema.parse({
    ...response,
    market_spec: {
      ...response.market_spec,
      question,
      resolution_rule: resolutionRule,
      edge_cases: edgeCases,
    },
    judge: {
      ...response.judge,
      final_question: finalQuestionValue || question,
      final_resolution_rule: finalResolutionRule,
    },
  });
}

function repairThresholds(input: ForgeRequest, response: ForgeResponse) {
  const thresholds = extractNumericThresholds(input.claim);

  if (thresholds.length === 0) {
    return response;
  }

  return ForgeResponseSchema.parse({
    ...response,
    market_spec: {
      ...response.market_spec,
      question: forcePreserveThresholds(
        response.market_spec.question,
        thresholds,
      ),
      resolution_rule: forcePreserveThresholds(
        response.market_spec.resolution_rule,
        thresholds,
      ),
    },
    judge: {
      ...response.judge,
      final_question: forcePreserveThresholds(
        response.judge.final_question,
        thresholds,
      ),
      final_resolution_rule: forcePreserveThresholds(
        response.judge.final_resolution_rule,
        thresholds,
      ),
    },
  });
}

function repairVagueClaim(input: ForgeRequest, response: ForgeResponse) {
  if (!isClearlyVagueClaim(input.claim)) {
    return response;
  }

  return ForgeResponseSchema.parse({
    ...response,
    market_spec: {
      ...response.market_spec,
      resolution_source:
        "No objective source can be selected until the claim defines a specific entity, metric, threshold, and deadline",
      resolution_rule:
        "This claim should not be published as written. It needs a named entity set, measurable threshold, objective resolution source, and explicit deadline before a YES/NO MarketSpec can resolve it fairly.",
      edge_cases: [
        "Subjective phrases such as moon, replace developers, crash, big company, or mainstream are not resolution criteria by themselves.",
        "A revised spec must define the exact metric, threshold, source, and settlement deadline.",
      ],
    },
    critic: {
      objections: [
        "The claim lacks objective resolution criteria.",
        "The claim needs a named entity set, measurable threshold, source, and deadline before publication.",
      ],
      ambiguity_risk: "high",
      suggested_fixes: [
        "Rewrite the claim with a specific metric, source, threshold, and deadline.",
        "Use needs_revision or rejected until those details are supplied.",
      ],
    },
    judge: {
      ...response.judge,
      verdict: "rejected",
      final_resolution_rule:
        "This claim should not be published as written. It needs a named entity set, measurable threshold, objective resolution source, and explicit deadline before a YES/NO MarketSpec can resolve it fairly.",
      reasoning: [
        "The source claim is too vague to settle objectively without adding facts not present in the claim.",
        "A human should rewrite it before publication.",
      ],
      confidence: Math.max(response.judge.confidence, 80),
    },
  });
}

export function repairMarketSpecQuality(
  input: ForgeRequest,
  response: ForgeResponse,
  referenceDate = new Date(),
) {
  let repaired = ForgeResponseSchema.parse(response);
  const explicitDeadline = extractExplicitDeadline(input.claim);
  const relativeDeadline = inferRelativeDeadline(input.claim, referenceDate);

  if (explicitDeadline) {
    repaired = forceDeadline(
      repaired,
      explicitDeadline.deadline,
      explicitDeadline.display,
    );
  } else if (relativeDeadline) {
    repaired = forceDeadline(
      repaired,
      relativeDeadline.deadline,
      longDate(relativeDeadline.deadline),
    );
  }

  repaired = repairQuestionReadability(input, repaired);
  repaired = repairThresholds(input, repaired);
  repaired = removeIrrelevantObjections(input, repaired, referenceDate);
  repaired = repairVagueClaim(input, repaired);
  repaired = normalizeScoreRanges(input, repaired, referenceDate);

  return ForgeResponseSchema.parse({
    ...repaired,
    market_spec: {
      ...repaired.market_spec,
      question: finalQuestion(repaired),
      outcomes: ["YES", "NO"],
      resolution_rule: finalResolutionRule(repaired),
    },
    judge: {
      ...repaired.judge,
      final_question: finalQuestion(repaired),
      final_resolution_rule: finalResolutionRule(repaired),
    },
  });
}
