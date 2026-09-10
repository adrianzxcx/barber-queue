import "server-only";

import type { ServiceDTO } from "@/lib/db/types";
import {
  haircutRecommendationResultSchema,
  type HaircutRecommendationInput,
  type HaircutRecommendationResult,
} from "@/lib/validation/ai";
import { buildHaircutRecommendationPrompt, extractJson, parseImageDataUrl } from "./shared";

const apiKey = process.env.AGNES_API_KEY;
const apiUrl = process.env.AGNES_API_URL;
const model = process.env.AGNES_MODEL;

interface AgnesResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  output_text?: string;
  text?: string;
}

function getResponseText(payload: AgnesResponse) {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => part.text)
      .filter(Boolean)
      .join("\n");
  }

  return payload.output_text ?? payload.text ?? "";
}

export async function getAgnesHaircutRecommendations(
  input: HaircutRecommendationInput,
  services: ServiceDTO[]
): Promise<HaircutRecommendationResult> {
  if (!apiKey || !apiUrl || !model) {
    throw new Error("Agnes is not configured. Add AGNES_API_KEY, AGNES_API_URL, and AGNES_MODEL to .env.");
  }

  const image = parseImageDataUrl(input.imageDataUrl);
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildHaircutRecommendationPrompt(input, services) },
            {
              type: "image_url",
              image_url: {
                url: `data:${image.mimeType};base64,${image.data}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Agnes authentication failed. Please check AGNES_API_KEY in .env.");
    }
    if (response.status === 429) {
      throw new Error("Agnes is temporarily unavailable because its API quota or rate limit has been reached.");
    }

    throw new Error(`Agnes could not generate recommendations. Status ${response.status}.`);
  }

  const payload = (await response.json()) as AgnesResponse;
  const text = getResponseText(payload);
  if (!text) {
    throw new Error("Agnes returned an empty recommendation response.");
  }

  return haircutRecommendationResultSchema.parse(JSON.parse(extractJson(text)));
}
