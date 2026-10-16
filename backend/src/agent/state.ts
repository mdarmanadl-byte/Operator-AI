import type { ToolResult } from "./tool-registry.js";

export type StepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface ExecutionStep {
  id: string;
  tool: string;
  instruction: string;
  purpose?: string;
  maxAttempts: number;
  status: StepStatus;
  attempts: number;
  output?: string;
  evidence?: Record<string, unknown>;
  error?: string;
}

export interface AgentState {
  taskId: string;
  instruction: string;
  status: "running" | "completed" | "failed";
  steps: ExecutionStep[];
  startedAt: string;
  completedAt?: string;
  finalOutput?: string;
  error?: string;
}

export function createAgentState(
  taskId: string,
  instruction: string,
  plannedSteps: Array<{
    id: string;
    tool: string;
    instruction: string;
    purpose?: string;
    maxAttempts?: number;
  }>,
): AgentState {
  if (plannedSteps.length === 0) {
    throw new Error("Execution plan must contain at least one step");
  }

  return {
    taskId,
    instruction,
    status: "running",
    startedAt: new Date().toISOString(),
    steps: plannedSteps.map((step) => ({
      id: step.id,
      tool: step.tool,
      instruction: step.instruction,
      purpose: step.purpose,
      maxAttempts: Math.min(
        3,
        Math.max(1, step.maxAttempts ?? 1),
      ),
      status: "pending",
      attempts: 0,
    })),
  };
}

export function recordStepResult(
  step: ExecutionStep,
  result: ToolResult,
): void {
  step.status = "completed";
  step.output = result.output;
  step.evidence = result.evidence;
  step.error = undefined;
}

export function recordStepFailure(
  step: ExecutionStep,
  error: unknown,
): void {
  step.status = "failed";
  step.error =
    error instanceof Error ? error.message : String(error);
}