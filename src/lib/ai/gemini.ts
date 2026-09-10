import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

import type { ServiceDTO } from "@/lib/db/types";
import {
  haircutRecommendationResultSchema,
  type HaircutRecommendationInput,
  type HaircutRecommendationResult,
} from "@/lib/validation/ai";
import { buildHaircutRecommendationPrompt, extractJson, parseImageDataUrl } from "./shared";

const apiKey =
  process.env.GEMINI_API_KEY ??
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
  process.env.GOOGLE_AI_API_KEY;

const modelNames = (
  process.env.GEMINI_MODELS ??
  process.env.GEMINI_MODEL ??
  "gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

function toGeminiErrorMessage(errors: string[]) {
  const combined = errors.join("\n").toLowerCase();

  if (
    combined.includes("429") ||
    combined.includes("too many requests") ||
    combined.includes("resource_exhausted") ||
    combined.includes("quota exceeded")
  ) {
    return "Gemini is temporarily unavailable because the API quota or rate limit has been reached. Please try again later or enable billing/increase quota for the Gemini API key.";
  }

  if (combined.includes("503") || combined.includes("service unavailable") || combined.includes("high demand")) {
    return "Gemini is currently experiencing high demand. Please try again in a few minutes.";
  }

  if (combined.includes("api key not valid") || combined.includes("permission_denied") || combined.includes("unauthenticated")) {
    return "Gemini API authentication failed. Please check the Gemini API key in .env.";
  }

  return "Gemini could not generate recommendations right now. Please try again later.";
}

export async function getHaircutRecommendations(
  input: HaircutRecommendationInput,
  services: ServiceDTO[]
): Promise<HaircutRecommendationResult> {
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Add GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GOOGLE_AI_API_KEY to .env."
    );
  }

  const image = parseImageDataUrl(input.imageDataUrl);
  const genAI = new GoogleGenerativeAI(apiKey);
  const errors: string[] = [];

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
        },
      });

      const response = await model.generateContent([
        buildHaircutRecommendationPrompt(input, services),
        {
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        },
      ]);
      const text = response.response.text();
      const parsed = JSON.parse(extractJson(text));

      return haircutRecommendationResultSchema.parse(parsed);
    } catch (error) {
      errors.push(`${modelName}: ${error instanceof Error ? error.message : "Unknown Gemini error"}`);
    }
  }

  throw new Error(toGeminiErrorMessage(errors));
}
