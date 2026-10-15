import {
  getTool,
  type ToolResult,
} from "./tool-registry.js";

import type { ExecutionStep } from "./state.js";

import {
  verifyStep,
  type VerificationResult,
} from "./verifier.js";

export interface StepExecutionResult {
  result: ToolResult;
  verification: VerificationResult;
  attempts: number;
}

const MAX_ATTEMPTS = 3;

export async function executeStep(
  step: ExecutionStep,
): Promise<StepExecutionResult> {
  const tool = getTool(step.tool);

  if (!tool) {
    throw new Error(`Tool "${step.tool}" is not registered`);
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    step.attempts = attempt;
    step.status = "running";

    try {
      const result = await tool.execute(step.instruction);

      const verification = await verifyStep(
        tool,
        step.instruction,
        result,
      );

      if (!verification.verified) {
        throw new Error(verification.reason);
      }

      return {
        result,
        verification,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error;

      if (attempt < MAX_ATTEMPTS) {
        // Short bounded delay before retrying.
        await new Promise((resolve) =>
          setTimeout(resolve, attempt * 250),
        );
      }
    }
  }

  throw new Error(
    `Step "${step.id}" failed after ${MAX_ATTEMPTS} attempts: ${
      lastError instanceof Error
        ? lastError.message
        : String(lastError)
    }`,
  );
}