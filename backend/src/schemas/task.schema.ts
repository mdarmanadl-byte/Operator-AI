import { z } from "zod";

export const createTaskSchema = z.object({
  instruction: z
    .string()
    .trim()
    .min(3, "Instruction must contain at least 3 characters")
    .max(5000, "Instruction must not exceed 5000 characters"),
});

export type CreateTaskRequest = z.infer<typeof createTaskSchema>;