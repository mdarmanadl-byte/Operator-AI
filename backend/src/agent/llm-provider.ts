import "dotenv/config";

export type LLMProvider = "groq" | "gemini" | "openrouter";

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionOptions {
  temperature?: number;
}

interface ChatCompletionResult {
  content: string;
  provider: LLMProvider;
  model: string;
}

const DEFAULT_BASE_URLS: Record<LLMProvider, string> = {
  groq: "https://api.groq.com/openai/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  openrouter: "https://openrouter.ai/api/v1",
};

function loadConfig(): LLMConfig {
  const provider = (
    process.env.LLM_PROVIDER ?? "groq"
  ).toLowerCase() as LLMProvider;

  if (!["groq", "gemini", "openrouter"].includes(provider)) {
    throw new Error(
      `Unsupported LLM_PROVIDER "${provider}". ` +
        "Choose groq, gemini, or openrouter.",
    );
  }

  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  if (!apiKey) {
    throw new Error("LLM_API_KEY is not configured");
  }

  if (!model) {
    throw new Error("LLM_MODEL is not configured");
  }

  const baseUrl = (
    process.env.LLM_BASE_URL || DEFAULT_BASE_URLS[provider]
  ).replace(/\/+$/, "");

  return {
    provider,
    apiKey,
    model,
    baseUrl,
  };
}

export async function generateCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<ChatCompletionResult> {
  const config = loadConfig();

  const response = await fetch(
    `${config.baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(config.provider === "openrouter"
          ? {
              "HTTP-Referer":
                process.env.OPENROUTER_SITE_URL ??
                "http://localhost:3000",
              "X-Title": "Operator AI",
            }
          : {}),
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: options.temperature ?? 0,
        response_format: {
          type: "json_object",
        },
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `LLM request failed (${response.status}) ` +
        `[${config.provider}]: ${details.slice(0, 1000)}`,
    );
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("choices" in data) ||
    !Array.isArray(data.choices)
  ) {
    throw new Error("LLM provider returned an invalid response");
  }

  const firstChoice = data.choices[0];

  if (
    typeof firstChoice !== "object" ||
    firstChoice === null ||
    !("message" in firstChoice) ||
    typeof firstChoice.message !== "object" ||
    firstChoice.message === null ||
    !("content" in firstChoice.message) ||
    typeof firstChoice.message.content !== "string"
  ) {
    throw new Error("LLM provider returned empty or invalid content");
  }

  return {
    content: firstChoice.message.content,
    provider: config.provider,
    model: config.model,
  };
}