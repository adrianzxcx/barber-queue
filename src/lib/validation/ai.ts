import { z } from "zod";

export const haircutRecommendationInputSchema = z.object({
  imageDataUrl: z
    .string()
    .trim()
    .min(1, "Upload or take a photo first.")
    .refine((value) => /^data:image\/(png|jpe?g|webp);base64,/i.test(value), {
      message: "Use a PNG, JPG, JPEG, or WEBP photo.",
    })
    .refine((value) => value.length <= 7_000_000, {
      message: "Photo is too large. Please upload an image under about 5 MB.",
    }),
  notes: z.string().trim().max(500).optional().default(""),
});

export const haircutRecommendationSchema = z.object({
  styleName: z.string().trim().min(1).max(80),
  confidence: z.number().min(0).max(100),
  whyItFits: z.string().trim().min(1).max(500),
  maintenance: z.enum(["Low", "Medium", "High"]),
  stylingNotes: z.string().trim().min(1).max(500),
  recommendedServiceName: z.string().trim().max(80).optional().default(""),
  barberNotes: z.array(z.string().trim().min(1).max(160)).max(4).default([]),
});

export const haircutRecommendationResultSchema = z.object({
  summary: z.string().trim().min(1).max(500),
  recommendations: z.array(haircutRecommendationSchema).min(1).max(3),
});

export type HaircutRecommendationInput = z.input<typeof haircutRecommendationInputSchema>;
export type HaircutRecommendationResult = z.infer<typeof haircutRecommendationResultSchema>;
