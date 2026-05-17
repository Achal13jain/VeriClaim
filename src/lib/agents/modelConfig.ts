export type ModelProviderKind = "gemini" | "groq" | "openai" | "openrouter";

export interface ModelProviderConfig {
  kind: ModelProviderKind;
  family: string;
  role: "forger" | "critic" | "judge";
  model: string;
  apiKey: string;
}

export interface LiveModelConfig {
  mode: "live";
  forger: ModelProviderConfig;
  critic: ModelProviderConfig;
  judge: ModelProviderConfig;
}

export interface DemoModelConfig {
  mode: "demo";
  reason: string;
}

export type ForgeModelConfig = LiveModelConfig | DemoModelConfig;

const adversarialWarning =
  "Live adversarial mode disabled: Forger and Critic require separate model families.";

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function getForgeModelConfig(): ForgeModelConfig {
  const geminiKey = readEnv("GEMINI_API_KEY");
  const groqKey = readEnv("GROQ_API_KEY");

  if (!geminiKey || !groqKey) {
    return {
      mode: "demo",
      reason: `${adversarialWarning} Missing Gemini or Groq API key.`,
    };
  }

  const forger: ModelProviderConfig = {
    kind: "gemini",
    family: "gemini",
    role: "forger",
    model: readEnv("GEMINI_MODEL") || "gemini-2.5-flash",
    apiKey: geminiKey,
  };

  const critic: ModelProviderConfig = {
    kind: "groq",
    family: "groq",
    role: "critic",
    model: readEnv("GROQ_MODEL") || "llama-3.1-8b-instant",
    apiKey: groqKey,
  };

  if (forger.family === critic.family) {
    return {
      mode: "demo",
      reason: adversarialWarning,
    };
  }

  const openAiKey = readEnv("OPENAI_API_KEY");
  const openRouterKey = readEnv("OPENROUTER_API_KEY");

  const judge: ModelProviderConfig = openAiKey
    ? {
        kind: "openai",
        family: "openai",
        role: "judge",
        model: readEnv("OPENAI_MODEL") || "gpt-4o-mini",
        apiKey: openAiKey,
      }
    : openRouterKey
      ? {
          kind: "openrouter",
          family: "openrouter",
          role: "judge",
          model: readEnv("OPENROUTER_MODEL") || "openai/gpt-4o-mini",
          apiKey: openRouterKey,
        }
      : {
          ...critic,
          role: "judge",
        };

  return {
    mode: "live",
    forger,
    critic,
    judge,
  };
}
