import { z } from "zod";
import { generateCompletion } from "./llm-provider.js";
import { getTool, listTools } from "./tool-registry.js";
import "./register-tools.js";

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

Available tools:
${JSON.stringify(availableTools, null, 2)}

    Create a short, ordered execution plan using only these tools.

Rules:
    - Return valid JSON only.
- Never invent tool names.
- Every step must specify an available tool.
    - Every step must use a registered tool.
    - Each step must be one actionable operation.
    - Instructions must follow the selected tool's supported format.
- Do not claim an action has already happened.
    - Use at most 8 steps.
    - Use maxAttempts=1 for mutations.
    - Retries must never exceed 3.
    - Do not invent data or pretend an operation succeeded.

    Return:
{
      "goal": "the user's goal",
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

  let raw: unknown;

  try {
    raw = JSON.parse(response.content);
  } catch {
    throw new Error("LLM planner returned invalid JSON");
  }

  const parsed = ExecutionPlanSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(
      `Invalid execution plan: ${parsed.error.message}`,
    );
  }

  const plan = parsed.data;

  for (const [index, step] of plan.steps.entries()) {
    if (step.id !== index + 1) {
      throw new Error(
        "Plan step IDs must be sequential, starting at 1",
      );
    }

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