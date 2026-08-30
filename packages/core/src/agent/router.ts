import {
  SupportedModelProvider,
  resolveModelProviderConfig,
  getDefaultModelForProvider,
  getDefaultFastModelForProvider,
} from "./provider.js";

export type ModelTier = "reasoning" | "fast";

export interface ModelConfig {
  provider: SupportedModelProvider;
  modelName: string;
  temperature: number;
}

export function routeModel(
  taskType: "rca" | "patch" | "triage" | "verify",
  overrideProvider?: string
): ModelConfig {
  const resolved = resolveModelProviderConfig({ provider: overrideProvider });

  // Use primary reasoning model for deep reasoning (RCA & complex patch synthesis)
  if (taskType === "rca" || taskType === "patch") {
    const reasoningModel =
      process.env.DEBUGFORGE_REASONING_MODEL ||
      process.env.REASONING_MODEL ||
      resolved.modelId ||
      getDefaultModelForProvider(resolved.provider);

    return {
      provider: resolved.provider,
      modelName: reasoningModel,
      temperature: 0.1,
    };
  }

  // Use fast model for triage and verification
  const fastModel =
    process.env.DEBUGFORGE_FAST_MODEL ||
    process.env.FAST_MODEL ||
    getDefaultFastModelForProvider(resolved.provider);

  return {
    provider: resolved.provider,
    modelName: fastModel,
    temperature: 0.0,
  };
}
