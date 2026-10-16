import {
  createPlan,
  type ExecutionPlan,
} from "./planner.js";

import {
  createAgentState,
  recordStepFailure,
  recordStepResult,
  type AgentState,
} from "./state.js";

import { updateTaskExecution } from "../services/task.service.js";
import { executeStep } from "./executor.js";
import { recordTaskEvent } from "../services/task-event.service.js";

const CANCELLATION_MESSAGE = "Task execution cancelled";

export interface AgentExecutionResult {
  plan: ExecutionPlan;
  state: AgentState;
  output: string;
  evidence: Record<string, unknown>;
}

export async function runAgent(
  taskId: string,
  instruction: string,
  signal?: AbortSignal,
): Promise<AgentExecutionResult> {
  let plan: ExecutionPlan | undefined;
  let state: AgentState | undefined;

  try {
    // Do not start or continue a task that has already been cancelled.
    if (signal?.aborted) {
      throw new Error(CANCELLATION_MESSAGE);
    }

    await updateTaskExecution(taskId, {
      status: "running",
    });

    if (signal?.aborted) {
      throw new Error(CANCELLATION_MESSAGE);
    }

    plan = await createPlan(instruction);

    if (signal?.aborted) {
      throw new Error(CANCELLATION_MESSAGE);
    }

    state = createAgentState(
      taskId,
      instruction,
      plan.steps.map((step) => ({
        id: String(step.id),
        tool: step.toolName,
        instruction: step.instruction,
        purpose: step.purpose,
        maxAttempts: step.maxAttempts,
      })),
    );

    await recordTaskEvent(
      taskId,
      "plan_created",
      JSON.stringify(plan),
    );

    let finalOutput = "";
    let finalEvidence: Record<string, unknown> = {};

    for (const plannedStep of plan.steps) {
      if (signal?.aborted) {
        throw new Error(CANCELLATION_MESSAGE);
      }

      const step = state.steps.find(
        (item) => item.id === String(plannedStep.id),
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

      if (signal?.aborted) {
        throw new Error(CANCELLATION_MESSAGE);
      }

      try {
        const execution = await executeStep(step, signal);

        if (signal?.aborted) {
          throw new Error(CANCELLATION_MESSAGE);
        }

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
        console.error("AGENT EXECUTION ERROR:", error);
        recordStepFailure(step, error);
        throw error;
      }
    }

    // Prevent a cancellation during the final step from becoming success.
    if (signal?.aborted) {
      throw new Error(CANCELLATION_MESSAGE);
    }

    state.status = "completed";
    state.completedAt = new Date().toISOString();
    state.finalOutput = finalOutput;

    const result: AgentExecutionResult = {
      plan,
      state,
      output: finalOutput,
      evidence: finalEvidence,
    };

    await recordTaskEvent(
      taskId,
      "execution_completed",
      JSON.stringify(result),
    );

    // The task service must prevent this update from overwriting a
    // cancellation that has already been persisted in the database.
    if (signal?.aborted) {
      throw new Error(CANCELLATION_MESSAGE);
    }

    await updateTaskExecution(taskId, {
      status: "completed",
      result,
      completedAt: new Date(),
    });

    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    const cancelled =
      signal?.aborted || message === CANCELLATION_MESSAGE;

    if (state) {
      state.status = cancelled ? "cancelled" : "failed";
      state.completedAt = new Date().toISOString();
      state.error = message;
    }

    const failureResult = {
      error: message,
      ...(plan ? { plan } : {}),
      ...(state ? { state } : {}),
    };

    // Log cancellation and failure as distinct outcomes.
    try {
      await recordTaskEvent(
        taskId,
        cancelled ? "execution_cancelled" : "execution_failed",
        JSON.stringify(failureResult),
      );
    } catch {
      // Event logging must not hide the original execution error.
    }

    // Persist the final status even if planning failed before state creation.
    try {
      await updateTaskExecution(taskId, {
        status: cancelled ? "cancelled" : "failed",
        result: failureResult,
        completedAt: new Date(),
      });
    } catch {
      // Preserve the original execution error if persistence also fails.
    }

    throw error;
  }
}