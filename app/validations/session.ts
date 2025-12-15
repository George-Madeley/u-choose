import z from "zod";
import { isSessionValid } from "~/api/firebase/db";

export const sessionSchema = z.object({
  sessionId: z.string().trim().length(20).refine(isSessionValid),
});

export type SessionForm = z.infer<typeof sessionSchema>;

export const messagingSchema = z.object({
  message: z.string().trim().max(32),
});

export type MessagingForm = z.infer<typeof messagingSchema>;

export const messagesSchema = z.record(
  z.string().trim().length(20),
  messagingSchema
);

export type Messages = z.infer<typeof messagesSchema>;
