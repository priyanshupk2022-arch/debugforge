export type SupportedModelProvider =
  | "openai"
  | "anthropic"
  | "google-gemini"
  | "custom"
  | "fireworks"
  | "together-ai"
  | "alibaba"
  | "zai";

export interface ResolvedModelConfig {
  provider: SupportedModelProvider;
  rawProviderName: string;
  modelId: string;
  fullModelName: string; // formatted as "provider/modelId" for TrueForge
  apiKey?: string;
  baseUrl?: string;
  isMockProvider?: boolean;
}

export interface ResolveProviderOptions {
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  requireCredentials?: boolean;
}

/**
 * Normalizes user-supplied provider names into TrueForge SDK provider types.
 */
export function normalizeProviderName(rawProvider?: string): SupportedModelProvider {
  const p = (rawProvider || "").trim().toLowerCase();
  if (p === "anthropic" || p === "claude") return "anthropic";
  if (p === "google" || p === "gemini" || p === "google-gemini" || p === "google_gemini") return "google-gemini";
  if (p === "fireworks") return "fireworks";
  if (p === "together" || p === "together-ai" || p === "together_ai") return "together-ai";
  if (p === "alibaba" || p === "qwen") return "alibaba";
  if (p === "zai") return "zai";
  if (p === "custom" || p === "deepseek" || p === "ollama" || p === "local") return "custom";
  return "openai";
}

/**
 * Returns the default primary reasoning model for a given provider.
 */
export function getDefaultModelForProvider(provider: SupportedModelProvider): string {
  switch (provider) {
    case "anthropic":
      return "claude-3-5-sonnet-latest";
    case "google-gemini":
      return "gemini-2.0-flash";
    case "custom":
      return "deepseek-chat";
    case "together-ai":
      return "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo";
    case "fireworks":
      return "accounts/fireworks/models/deepseek-v3";
    case "alibaba":
      return "qwen-max";
    case "zai":
      return "glm-4";
    case "openai":
    default:
      return "gpt-4o";
  }
}

/**
 * Returns the default fast/auxiliary model for a given provider.
 */
export function getDefaultFastModelForProvider(provider: SupportedModelProvider): string {
  switch (provider) {
    case "anthropic":
      return "claude-3-5-haiku-latest";
    case "google-gemini":
      return "gemini-1.5-flash";
    case "custom":
      return "deepseek-chat";
    case "together-ai":
      return "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo";
    case "fireworks":
      return "accounts/fireworks/models/llama-v3p1-8b-instruct";
    case "alibaba":
      return "qwen-plus";
    case "zai":
      return "glm-4-flash";
    case "openai":
    default:
      return "gpt-4o-mini";
  }
}

/**
 * Resolves the active model provider configuration from explicit options or environment variables.
 * Environment variables checked (in priority order):
 *  - DEBUGFORGE_MODEL_PROVIDER / MODEL_PROVIDER / LLM_PROVIDER
 *  - DEBUGFORGE_MODEL / MODEL_NAME / LLM_MODEL
 *  - Provider-specific API keys (ANTHROPIC_API_KEY, GEMINI_API_KEY/GOOGLE_API_KEY, OPENAI_API_KEY, CUSTOM_API_KEY/DEEPSEEK_API_KEY)
 */
export function resolveModelProviderConfig(options: ResolveProviderOptions = {}): ResolvedModelConfig {
  const rawProvider =
    options.provider ||
    process.env.DEBUGFORGE_MODEL_PROVIDER ||
    process.env.MODEL_PROVIDER ||
    process.env.LLM_PROVIDER ||
    "openai";

  const normalizedProvider = normalizeProviderName(rawProvider);

  let rawModel =
    options.model ||
    process.env.DEBUGFORGE_MODEL ||
    process.env.MODEL_NAME ||
    process.env.LLM_MODEL ||
    getDefaultModelForProvider(normalizedProvider);

  // Strip leading provider prefix if user specified "anthropic/claude-3-5-sonnet"
  let modelId = rawModel;
  if (rawModel.includes("/")) {
    const parts = rawModel.split("/");
    modelId = parts.slice(1).join("/");
  }

  // Resolve API Key per provider
  let apiKey = options.apiKey;
  if (!apiKey) {
    switch (normalizedProvider) {
      case "anthropic":
        apiKey = process.env.ANTHROPIC_API_KEY;
        break;
      case "google-gemini":
        apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
        break;
      case "custom":
        apiKey = process.env.CUSTOM_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.LOCAL_API_KEY;
        break;
      case "together-ai":
        apiKey = process.env.TOGETHER_API_KEY || process.env.TOGETHERAI_API_KEY;
        break;
      case "fireworks":
        apiKey = process.env.FIREWORKS_API_KEY;
        break;
      case "alibaba":
        apiKey = process.env.ALIBABA_API_KEY || process.env.DASHSCOPE_API_KEY;
        break;
      case "zai":
        apiKey = process.env.ZAI_API_KEY || process.env.ZHIPU_API_KEY;
        break;
      case "openai":
      default:
        apiKey = process.env.OPENAI_API_KEY;
        break;
    }
  }

  const baseUrl =
    options.baseUrl ||
    process.env.DEBUGFORGE_BASE_URL ||
    process.env.MODEL_BASE_URL ||
    process.env.CUSTOM_BASE_URL ||
    process.env.DEEPSEEK_BASE_URL;

  // Fail-Closed Validation when credentials are required (production / live runs)
  if (options.requireCredentials && !apiKey) {
    throw new Error(
      `[Model Provider Blocker] Missing required API key for provider "${normalizedProvider}". Set ${getEnvVarHintForProvider(
        normalizedProvider
      )} or configure credentials before executing in live mode.`
    );
  }

  return {
    provider: normalizedProvider,
    rawProviderName: rawProvider,
    modelId,
    fullModelName: `${normalizedProvider}/${modelId}`,
    apiKey,
    baseUrl,
    isMockProvider: false,
  };
}

/**
 * Returns environment variable hint for missing credential error messages.
 */
export function getEnvVarHintForProvider(provider: SupportedModelProvider): string {
  switch (provider) {
    case "anthropic":
      return "ANTHROPIC_API_KEY";
    case "google-gemini":
      return "GEMINI_API_KEY (or GOOGLE_API_KEY)";
    case "custom":
      return "CUSTOM_API_KEY (or DEEPSEEK_API_KEY)";
    case "together-ai":
      return "TOGETHER_API_KEY";
    case "fireworks":
      return "FIREWORKS_API_KEY";
    case "alibaba":
      return "ALIBABA_API_KEY";
    case "zai":
      return "ZAI_API_KEY";
    case "openai":
    default:
      return "OPENAI_API_KEY";
  }
}

/**
 * Builds the TrueForge ModelProviderManifest for client.settings.modelProviders.createOrUpdate
 */
export function buildTrueForgeProviderManifest(config: ResolvedModelConfig): any {
  if (!config.apiKey && !config.baseUrl) {
    throw new Error(
      `[TrueForge Provider Blocker] Cannot register provider "${config.provider}" without API credentials or baseUrl.`
    );
  }

  const baseManifest: any = {
    name: config.provider,
    type: config.provider,
  };

  if (config.provider === "custom") {
    return {
      manifest: {
        type: "custom",
        name: "custom-provider",
        baseUrl: config.baseUrl || "http://localhost:8000/v1",
        auth: config.apiKey ? { apiKey: config.apiKey } : undefined,
        models: [
          { modelId: config.modelId, name: config.modelId, properties: {} },
        ],
      },
    };
  }

  return {
    manifest: {
      ...baseManifest,
      auth: { apiKey: config.apiKey },
      ...(config.baseUrl ? { baseUrl: config.baseUrl } : {}),
      models: [
        { modelId: config.modelId, name: config.modelId, properties: {} },
        { modelId: getDefaultFastModelForProvider(config.provider), name: getDefaultFastModelForProvider(config.provider), properties: {} },
      ],
    },
  };
}

/**
 * Formats a clean UI string showing the active provider and model.
 */
export function formatProviderLabel(config: ResolvedModelConfig): string {
  const providerName =
    config.provider === "google-gemini"
      ? "Google"
      : config.provider.charAt(0).toUpperCase() + config.provider.slice(1);

  return `${providerName} (${config.modelId})`;
}
