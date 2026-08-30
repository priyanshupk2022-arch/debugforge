export type SupportedModelProvider =
  | "openai"
  | "anthropic"
  | "google-gemini"
  | "custom"
  | "together"
  | "fireworks"
  | "alibaba"
  | "moonshot"
  | "zai";

export const VALID_TRUEFORGE_PROVIDER_TYPES: readonly SupportedModelProvider[] = [
  "openai",
  "anthropic",
  "google-gemini",
  "custom",
  "together",
  "fireworks",
  "alibaba",
  "moonshot",
  "zai",
] as const;

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
 * Normalizes user-supplied provider names into official TrueForge SDK provider types.
 * 
 * Rules:
 *  - When rawProvider is omitted (undefined, null, or empty/whitespace string): returns "openai" (default).
 *  - When rawProvider is provided: trims whitespace, normalizes case, and matches against supported aliases.
 *  - When rawProvider is unrecognized: THROWS [TrueForge Provider Blocker] error (never silently defaults to openai).
 */
export function normalizeProviderName(rawProvider?: string): SupportedModelProvider {
  if (rawProvider === undefined || rawProvider === null || rawProvider.trim() === "") {
    return "openai";
  }

  const p = rawProvider.trim().toLowerCase();

  if (p === "openai" || p === "gpt") return "openai";
  if (p === "anthropic" || p === "claude") return "anthropic";
  if (p === "google" || p === "gemini" || p === "google-gemini" || p === "google_gemini") return "google-gemini";
  if (p === "together" || p === "together-ai" || p === "together_ai") return "together";
  if (p === "fireworks") return "fireworks";
  if (p === "alibaba" || p === "qwen") return "alibaba";
  if (p === "moonshot") return "moonshot";
  if (p === "zai") return "zai";
  if (p === "custom" || p === "deepseek" || p === "ollama" || p === "local") return "custom";

  throw new Error(
    `[TrueForge Provider Blocker] Unsupported provider type "${rawProvider.trim()}". Supported types: ${VALID_TRUEFORGE_PROVIDER_TYPES.join(
      ", "
    )}`
  );
}

/**
 * Validates whether a given provider string is supported by the TrueForge runtime.
 * Returns false for unknown or invalid providers without throwing.
 */
export function isSupportedProviderType(provider?: string): provider is SupportedModelProvider {
  if (!provider || provider.trim() === "") return false;
  try {
    const normalized = normalizeProviderName(provider);
    return VALID_TRUEFORGE_PROVIDER_TYPES.includes(normalized);
  } catch {
    return false;
  }
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
    case "together":
      return "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo";
    case "fireworks":
      return "accounts/fireworks/models/deepseek-v3";
    case "alibaba":
      return "qwen-max";
    case "moonshot":
      return "moonshot-v1-8k";
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
    case "together":
      return "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo";
    case "fireworks":
      return "accounts/fireworks/models/llama-v3p1-8b-instruct";
    case "alibaba":
      return "qwen-plus";
    case "moonshot":
      return "moonshot-v1-8k";
    case "zai":
      return "glm-4-flash";
    case "openai":
    default:
      return "gpt-4o-mini";
  }
}

/**
 * Resolves the active model provider configuration from explicit options or environment variables.
 * 
 * Rules:
 *  - If an explicit or env provider is given, it MUST be valid or it will throw [TrueForge Provider Blocker].
 *  - If no provider is given in options or env, defaults safely to "openai".
 */
export function resolveModelProviderConfig(options: ResolveProviderOptions = {}): ResolvedModelConfig {
  let rawProvider = options.provider;

  if (rawProvider === undefined || rawProvider === null || rawProvider.trim() === "") {
    rawProvider =
      process.env.DEBUGFORGE_MODEL_PROVIDER ||
      process.env.MODEL_PROVIDER ||
      process.env.LLM_PROVIDER;
  }

  // Normalization will throw [TrueForge Provider Blocker] if rawProvider is explicitly invalid
  const normalizedProvider = normalizeProviderName(rawProvider);
  const displayProvider = rawProvider && rawProvider.trim() !== "" ? rawProvider.trim() : "openai";

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
      case "together":
        apiKey = process.env.TOGETHER_API_KEY || process.env.TOGETHERAI_API_KEY;
        break;
      case "fireworks":
        apiKey = process.env.FIREWORKS_API_KEY;
        break;
      case "alibaba":
        apiKey = process.env.ALIBABA_API_KEY || process.env.DASHSCOPE_API_KEY;
        break;
      case "moonshot":
        apiKey = process.env.MOONSHOT_API_KEY;
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
  if (options.requireCredentials && !apiKey && normalizedProvider !== "custom") {
    throw new Error(
      `[Model Provider Blocker] Missing required API key for provider "${normalizedProvider}". Set ${getEnvVarHintForProvider(
        normalizedProvider
      )} or configure credentials before executing in live mode.`
    );
  }

  return {
    provider: normalizedProvider,
    rawProviderName: displayProvider,
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
    case "together":
      return "TOGETHER_API_KEY";
    case "fireworks":
      return "FIREWORKS_API_KEY";
    case "alibaba":
      return "ALIBABA_API_KEY";
    case "moonshot":
      return "MOONSHOT_API_KEY";
    case "zai":
      return "ZAI_API_KEY";
    case "openai":
    default:
      return "OPENAI_API_KEY";
  }
}

/**
 * Builds the official TrueForge ModelProviderManifest schema.
 */
export function buildTrueForgeProviderManifest(config: ResolvedModelConfig): any {
  if (!VALID_TRUEFORGE_PROVIDER_TYPES.includes(config.provider)) {
    throw new Error(
      `[TrueForge Provider Blocker] Unsupported provider type "${config.provider}". Supported types: ${VALID_TRUEFORGE_PROVIDER_TYPES.join(
        ", "
      )}`
    );
  }

  if (config.provider === "custom") {
    if (!config.baseUrl) {
      throw new Error(
        `[TrueForge Provider Blocker] Custom model provider requires a valid baseUrl (e.g. http://localhost:8000/v1 or https://api.deepseek.com/v1).`
      );
    }
    return {
      manifest: {
        type: "custom",
        name: config.rawProviderName || "custom",
        baseUrl: config.baseUrl,
        auth: config.apiKey ? { apiKey: config.apiKey } : undefined,
        models: [
          { modelId: config.modelId, name: config.modelId, properties: {} },
        ],
      },
    };
  }

  if (!config.apiKey) {
    throw new Error(
      `[TrueForge Provider Blocker] Cannot register provider "${config.provider}" without an API key. Set ${getEnvVarHintForProvider(
        config.provider
      )}.`
    );
  }

  return {
    manifest: {
      type: config.provider,
      auth: { apiKey: config.apiKey },
      ...(config.baseUrl ? { baseUrl: config.baseUrl } : {}),
      models: [
        { modelId: config.modelId, name: config.modelId, properties: {} },
        {
          modelId: getDefaultFastModelForProvider(config.provider),
          name: getDefaultFastModelForProvider(config.provider),
          properties: {},
        },
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
