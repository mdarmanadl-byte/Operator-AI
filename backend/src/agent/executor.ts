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

export async function executeStep(
  step: ExecutionStep,
): Promise<StepExecutionResult> {
  const tool = getTool(step.tool);

  if (!tool) {
    throw new Error(`Tool "${step.tool}" is not registered`);
  }

  if (!tool.canHandle(step.instruction)) {
    throw new Error(
      `Tool "${step.tool}" cannot handle this instruction`,
    );
  }

  const maxAttempts = Math.min(
    3,
    Math.max(1, step.maxAttempts),
  );

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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

      if (attempt < maxAttempts) {
        await new Promise((resolve) =>
          setTimeout(resolve, attempt * 250),
        );
      }
    }
  }

  throw new Error(
    `Step "${step.id}" failed after ${maxAttempts} attempt(s): ${
      lastError instanceof Error
        ? lastError.message
        : String(lastError)
    }`,
  );
}