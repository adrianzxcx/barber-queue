import "server-only";

import type { ServiceDTO } from "@/lib/db/types";
import type { HaircutRecommendationInput } from "@/lib/validation/ai";

export function extractJson(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
}

export function parseImageDataUrl(imageDataUrl: string) {
  const match = imageDataUrl.match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i);

  if (!match) {
    throw new Error("Use a PNG, JPG, JPEG, or WEBP photo.");
  }

  return {
    mimeType: match[1],
    data: match[2],
  };
}

export function buildHaircutRecommendationPrompt(input: HaircutRecommendationInput, services: ServiceDTO[]) {
  const availableServices = services.map((service) => ({
    name: service.name,
    category: service.category,
    duration: service.duration,
    description: service.description,
    features: service.features,
  }));

  return `You are a practical barber style assistant for a barbershop queue app.

Analyze the uploaded customer photo and recommend haircut styles that would suit the visible hair, face framing, and current haircut.
Use the optional customer notes only as extra context.
Do not identify the person or infer sensitive traits such as age, ethnicity, or gender.
Keep recommendations realistic for a barber to execute.

Customer notes:
${input.notes || "No extra notes provided."}

Available services:
${JSON.stringify(availableServices, null, 2)}

Return only valid JSON with this exact shape:
{
  "summary": "Short overall recommendation summary.",
  "recommendations": [
    {
      "styleName": "Style name",
      "confidence": 85,
      "whyItFits": "Why this fits the stated preferences.",
      "maintenance": "Low",
      "stylingNotes": "Simple styling and upkeep guidance.",
      "recommendedServiceName": "Best matching available service name, or empty string if none fits.",
      "barberNotes": ["Short instruction for the barber"]
    }
  ]
}`;
}
