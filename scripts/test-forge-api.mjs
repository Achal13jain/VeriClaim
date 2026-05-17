const baseUrl = process.env.FORGE_TEST_BASE_URL ?? "http://localhost:3000";

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function context(reference = new Date()) {
  const currentYear = reference.getUTCFullYear();
  const nextMonth = new Date(
    Date.UTC(currentYear, reference.getUTCMonth() + 1, 1),
  );

  return {
    currentYear,
    currentYearEnd: `${currentYear}-12-31`,
    beforeQ4: `${currentYear}-10-01`,
    nextMonthEnd: isoDate(
      new Date(
        Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0),
      ),
    ),
  };
}

const dates = context();

const cases = [
  {
    claim: "Bitcoin will hit $150k this year",
    sourceType: "manual",
    expectedDeadline: dates.currentYearEnd,
    validate(response) {
      assert(
        /bitcoin/i.test(response.market_spec.question),
        "Bitcoin case should stay about Bitcoin.",
      );
      assert(
        /reach or exceed/i.test(response.market_spec.question),
        "Bitcoin question should use clean reach-or-exceed wording.",
      );
      assert(
        /\b(coingecko|coinbase|binance|coinmarketcap)\b/i.test(
          response.market_spec.resolution_source,
        ),
        "Bitcoin case should name an explicit public price source.",
      );
    },
  },
  {
    claim: "OpenAI will release GPT-6 this year",
    sourceType: "manual",
    expectedDeadline: dates.currentYearEnd,
    validate(response) {
      assert(/openai/i.test(response.market_spec.question), "OpenAI case drifted.");
      assert(/gpt-6/i.test(response.market_spec.question), "GPT-6 case drifted.");
    },
  },
  {
    claim: "Arc mainnet launches before Q4",
    sourceType: "manual",
    expectedDeadline: dates.beforeQ4,
    validate(response) {
      assert(/arc/i.test(response.market_spec.question), "Arc case drifted.");
      assert(/mainnet/i.test(response.market_spec.question), "Arc mainnet missing.");
    },
  },
  {
    claim: "India will cut repo rates next month",
    sourceType: "manual",
    expectedDeadline: dates.nextMonthEnd,
    validate(response) {
      assert(/india|reserve bank of india|rbi/i.test(response.market_spec.question), "India/RBI case drifted.");
      assert(/repo/i.test(response.market_spec.question), "Repo rate missing.");
    },
  },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function forge(testCase) {
  const response = await fetch(`${baseUrl}/api/forge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      claim: testCase.claim,
      sourceType: testCase.sourceType,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `${testCase.claim}: API returned ${response.status}: ${JSON.stringify(payload)}`,
    );
  }

  return payload;
}

for (const testCase of cases) {
  const response = await forge(testCase);

  assert(
    response.market_spec.deadline === testCase.expectedDeadline,
    `${testCase.claim}: expected deadline ${testCase.expectedDeadline}, got ${response.market_spec.deadline}`,
  );
  assert(
    !/^202[0-5]-/.test(response.market_spec.deadline),
    `${testCase.claim}: deadline must not be in the past`,
  );
  assert(
    Array.isArray(response.market_spec.edge_cases) &&
      response.market_spec.edge_cases.length > 0,
    `${testCase.claim}: edge cases required`,
  );

  testCase.validate(response);

  console.log(
    `ok - ${testCase.claim} -> ${response.market_spec.deadline} (${response.judge.verdict})`,
  );
}
