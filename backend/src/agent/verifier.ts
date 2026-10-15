import type {
  AgentTool,
  ToolResult,
} from "./tool-registry.js";

export interface VerificationResult {
  verified: boolean;
  reason: string;
}

export async function verifyStep(
  tool: AgentTool,
  instruction: string,
  result: ToolResult,
): Promise<VerificationResult> {
  try {
    const verified = await tool.verify(instruction, result);

    if (!verified) {
      return {
        verified: false,
        reason: `Tool "${tool.name}" could not verify its result.`,
      };
    }

    return {
      verified: true,
      reason: "Tool verification succeeded.",
    };
  } catch (error) {
    return {
      verified: false,
      reason:
        error instanceof Error
          ? error.message
          : "Verification failed unexpectedly.",
    };
  }
}