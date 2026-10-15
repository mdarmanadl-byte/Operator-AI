import { findTool, listTools } from "./tool-registry.js";

export interface AgentPlan {
  goal: string;
  steps: Array<{
    id: string;
    tool: string;
    instruction: string;
    reason: string;
  }>;
}

export function createPlan(instruction: string): AgentPlan {
  const goal = instruction.trim();

  if (!goal) {
    throw new Error("Task instruction cannot be empty");
  }

  const tool = findTool(goal);

  if (!tool) {
    const available = listTools()
      .map((item) => item.name)
      .join(", ");

    throw new Error(
      `No tool can handle this task. Available tools: ${
        available || "none"
      }`,
    );
  }

  return {
    goal,
    steps: [
      {
        id: "step-1",
        tool: tool.name,
        instruction: goal,
        reason: `The ${tool.name} tool can handle this instruction.`,
      },
    ],
  };
}