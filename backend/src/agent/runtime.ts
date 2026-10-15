import type { AgentPlan } from "./planner.js";
import { createPlan } from "./planner.js";

import {
  createAgentState,
  recordStepFailure,
  recordStepResult,
  type AgentState,
} from "./state.js";

import { executeStep } from "./executor.js";

import { recordTaskEvent } from "../services/task-event.service.js";

export interface AgentExecutionResult {
  plan: AgentPlan;
  state: AgentState;
  output: string;
  evidence: Record<string, unknown>;
}

export async function runAgent(
  taskId: string,
  instruction: string,
): Promise<AgentExecutionResult> {
  const plan = createPlan(instruction);

  const state = createAgentState(
    taskId,
    instruction,
    plan.steps,
  );

  await recordTaskEvent(
    taskId,
    "plan_created",
    JSON.stringify(plan),
  );

  let finalOutput = "";
  let finalEvidence: Record<string, unknown> = {};

  try {
    for (const plannedStep of plan.steps) {
      const step = state.steps.find(
        (item) => item.id === plannedStep.id,
      );

      if (!step) {
        throw new Error(
          `Execution state missing step "${plannedStep.id}"`,
        );
      }

      await recordTaskEvent(
        taskId,
        "step_started",
        JSON.stringify({
          stepId: step.id,
          tool: step.tool,
          instruction: step.instruction,
        }),
      );

      try {
        const execution = await executeStep(step);

        recordStepResult(step, execution.result);

        finalOutput = execution.result.output;
        finalEvidence = execution.result.evidence;

        await recordTaskEvent(
          taskId,
          "step_verified",
          JSON.stringify({
            stepId: step.id,
            tool: step.tool,
            attempts: execution.attempts,
            output: execution.result.output,
            evidence: execution.result.evidence,
            verification: execution.verification,
          }),
        );
      } catch (error) {
        recordStepFailure(step, error);
        throw error;
      }
    }

    state.status = "completed";
    state.completedAt = new Date().toISOString();
    state.finalOutput = finalOutput;

    await recordTaskEvent(
      taskId,
      "execution_completed",
      JSON.stringify({
        output: finalOutput,
        evidence: finalEvidence,
        state,
      }),
    );

    return {
      plan,
      state,
      output: finalOutput,
      evidence: finalEvidence,
    };
  } catch (error) {
    state.status = "failed";
    state.completedAt = new Date().toISOString();
    state.error =
      error instanceof Error ? error.message : String(error);

    await recordTaskEvent(
      taskId,
      "execution_failed",
      JSON.stringify({
        error: state.error,
        state,
      }),
    );

    throw error;
  }
}