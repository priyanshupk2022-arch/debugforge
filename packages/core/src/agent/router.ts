export type ModelTier = "reasoning" | "fast";

export interface ModelConfig {
  provider: "openai" | "anthropic" | "custom";
  modelName: string;
  temperature: number;
}

export function routeModel(taskType: "rca" | "patch" | "triage" | "verify"): ModelConfig {
  // Use GPT-4o for deep reasoning (RCA & complex patch synthesis)
  if (taskType === "rca" || taskType === "patch") {
    return {
      provider: "openai",
      modelName: process.env.OPENAI_REASONING_MODEL || "gpt-4o",
      temperature: 0.1,
    };
  }

  // Use fast model (o3-mini / 3.5-turbo) for triage and verification
  return {
    provider: "openai",
    modelName: process.env.OPENAI_FAST_MODEL || "o3-mini",
    temperature: 0.0,
  };
}
