import "server-only";

import type { ServiceDTO } from "@/lib/db/types";
import type { HaircutRecommendationInput, HaircutRecommendationResult } from "@/lib/validation/ai";
import { getAgnesHaircutRecommendations } from "./agnes";
import { getHaircutRecommendations as getGeminiHaircutRecommendations } from "./gemini";

export async function getHaircutRecommendations(
  input: HaircutRecommendationInput,
  services: ServiceDTO[]
): Promise<HaircutRecommendationResult> {
  const provider = (process.env.AI_PROVIDER ?? "gemini").toLowerCase();

  if (provider === "agnes") {
    try {
      return await getAgnesHaircutRecommendations(input, services);
    } catch (error) {
      if (process.env.AI_FALLBACK_TO_GEMINI === "false") throw error;
      return getGeminiHaircutRecommendations(input, services);
    }
  }

  return getGeminiHaircutRecommendations(input, services);
}
