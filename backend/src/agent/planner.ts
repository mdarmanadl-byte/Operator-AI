import { z } from "zod";
import { getTool, listTools } from "./tool-registry.js";
import { generateCompletion } from "./llm-provider.js";

const ExecutionPlanSchema = z.object({
  goal: z.string().min(1),
  steps: z
    .array(
      z.object({
        id: z.number().int().positive(),
        toolName: z.string().min(1),
        instruction: z.string().min(1),
        purpose: z.string().min(1),
        maxAttempts: z.number().int().min(1).max(3),
      }),
    )
    .min(1)
    .max(8),
});

export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema> & {
  createdAt: string;
};

export async function createPlan(
  goal: string,
): Promise<ExecutionPlan> {
  const instruction = goal.trim();

  if (!instruction) {
    throw new Error("Task instruction cannot be empty");
  }

  const availableTools = listTools();

  if (availableTools.length === 0) {
    throw new Error("No agent tools are registered");
  }

  const response = await generateCompletion([
    {
      role: "system",
      content: `
You are the planning engine for Operator AI.

Create a plan for the user's goal using only the registered tools.

Available tools:
${JSON.stringify(availableTools, null, 2)}

Rules:
- Return JSON only.
- Never invent tool names.
- Every step must specify an available tool.
- Break multi-action tasks into ordered steps.
- Each instruction must describe one actionable operation.
- Do not claim an action has already happened.
- Use a maximum of 8 steps.
- Set maxAttempts to 1 for potentially non-idempotent actions.
- Use maxAttempts up to 3 only when retries are safe.

Required JSON structure:
{
  "goal": "string",
  "steps": [
    {
      "id": 1,
      "toolName": "registered tool name",
      "instruction": "specific action",
      "purpose": "why the action is required",
      "maxAttempts": 1
    }
  ]
}
      `.trim(),
    },
    {
      role: "user",
      content: instruction,
    },
  ]);

  let parsed: unknown;

  try {
    parsed = JSON.parse(response.content);
  } catch {
    throw new Error("LLM planner returned invalid JSON");
  }

  const validated = ExecutionPlanSchema.safeParse(parsed);

  if (!validated.success) {
    throw new Error(
      `Invalid execution plan: ${validated.error.message}`,
    );
  }

  const plan = validated.data;

  for (const step of plan.steps) {
    const tool = getTool(step.toolName);

    if (!tool) {
      throw new Error(
        `Planner selected unregistered tool: ${step.toolName}`,
      );
    }

    if (!tool.canHandle(step.instruction)) {
      throw new Error(
        `Tool "${step.toolName}" cannot handle instruction: ` +
          step.instruction,
      );
    }
  }

  return {
    ...plan,
    goal: instruction,
    createdAt: new Date().toISOString(),
  };
}