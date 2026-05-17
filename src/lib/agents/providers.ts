import { z } from "zod";

import type { ModelProviderConfig } from "@/lib/agents/modelConfig";

const DEFAULT_TIMEOUT_MS = 25_000;

export class ModelOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelOutputError";
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractTextFromOpenAiLikeResponse(payload: unknown) {
  const parsed = z
    .object({
      choices: z
        .array(
          z.object({
            message: z.object({
              content: z.string(),
            }),
          }),
        )
        .min(1),
    })
    .safeParse(payload);

  if (!parsed.success) {
    throw new ModelOutputError("Provider returned an unexpected chat response.");
  }

  return parsed.data.choices[0].message.content;
}

function extractTextFromGeminiResponse(payload: unknown) {
  const parsed = z
    .object({
      candidates: z
        .array(
          z.object({
            content: z.object({
              parts: z.array(z.object({ text: z.string() })).min(1),
            }),
          }),
        )
        .min(1),
    })
    .safeParse(payload);

  if (!parsed.success) {
    throw new ModelOutputError("Gemini returned an unexpected response.");
  }

  return parsed.data.candidates[0].content.parts
    .map((part) => part.text)
    .join("\n");
}

async function callGemini(
  provider: ModelProviderConfig,
  systemPrompt: string,
  userPrompt: string,
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`;
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}.`);
  }

  return extractTextFromGeminiResponse(payload);
}

async function callOpenAiCompatible(
  provider: ModelProviderConfig,
  systemPrompt: string,
  userPrompt: string,
) {
  const baseUrl =
    provider.kind === "groq"
      ? "https://api.groq.com/openai/v1"
      : provider.kind === "openrouter"
        ? "https://openrouter.ai/api/v1"
        : "https://api.openai.com/v1";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${provider.apiKey}`,
    "Content-Type": "application/json",
  };

  if (provider.kind === "openrouter") {
    headers["HTTP-Referer"] =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    headers["X-Title"] = "VeriClaim";
  }

  const response = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `${provider.kind} request failed with status ${response.status}.`,
    );
  }

  return extractTextFromOpenAiLikeResponse(payload);
}

export async function callJsonModel(
  provider: ModelProviderConfig,
  systemPrompt: string,
  userPrompt: string,
) {
  if (provider.kind === "gemini") {
    return callGemini(provider, systemPrompt, userPrompt);
  }

  return callOpenAiCompatible(provider, systemPrompt, userPrompt);
}

export function parseJsonObject(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new ModelOutputError("Model response did not contain JSON.");
    }

    return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
  }
}

export async function generateValidatedJson<T>(
  provider: ModelProviderConfig,
  schema: z.ZodType<T>,
  systemPrompt: string,
  userPrompt: string,
  label: string,
) {
  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const retryPrompt =
      attempt === 0
        ? userPrompt
        : `${userPrompt}

The previous ${label} response was invalid. Error:
${lastError}

Retry once. Return only valid JSON matching the requested schema.`;

    const text = await callJsonModel(provider, systemPrompt, retryPrompt);
    const parsedJson = parseJsonObject(text);
    const parsed = schema.safeParse(parsedJson);

    if (parsed.success) {
      return parsed.data;
    }

    lastError = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
  }

  throw new ModelOutputError(`${label} returned invalid JSON after retry.`);
}
