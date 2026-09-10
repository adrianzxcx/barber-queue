import { z } from "zod";

const rowIdSchema = z.string().trim().min(1, "Please choose an option.");

export const joinQueueSchema = z.object({
  serviceId: z.string().optional(),
  preferredBarberId: z
    .union([rowIdSchema, z.literal(""), z.null(), z.undefined()])
    .transform((value) => value || null),
});

export const ticketIdSchema = rowIdSchema;

export type JoinQueueInput = z.infer<typeof joinQueueSchema>;
