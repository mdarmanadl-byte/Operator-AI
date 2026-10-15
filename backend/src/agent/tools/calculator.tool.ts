import type { AgentTool, ToolResult } from "../tool-registry.js";

interface Calculation {
  left: number;
  operator: string;
  right: number;
}

function parseCalculation(
  instruction: string,
): Calculation | null {
  const match = instruction.match(
    /^\s*(?:(?:calculate|compute|what is)\s+)?(-?\d+(?:\.\d+)?)\s*(\+|-|\*|\/|plus|minus|times|multiplied by|divided by)\s*(-?\d+(?:\.\d+)?)\s*\??\s*$/i,
  );

  if (!match) {
    return null;
  }

  const left = Number(match[1]);
  const operator = match[2].toLowerCase();
  const right = Number(match[3]);

  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    return null;
  }

  return { left, operator, right };
}

function calculate(calculation: Calculation): number {
  const { left, operator, right } = calculation;

  switch (operator) {
    case "+":
    case "plus":
      return left + right;

    case "-":
    case "minus":
      return left - right;

    case "*":
    case "times":
    case "multiplied by":
      return left * right;

    case "/":
    case "divided by":
      if (right === 0) {
        throw new Error("Division by zero is not allowed");
      }

      return left / right;

    default:
      throw new Error("Unsupported arithmetic operator");
  }
}

export const calculatorTool: AgentTool = {
  name: "calculator",

  description:
    "Calculates basic arithmetic expressions and verifies the result.",

  canHandle(instruction: string): boolean {
    return parseCalculation(instruction) !== null;
  },

  async execute(instruction: string): Promise<ToolResult> {
    const calculation = parseCalculation(instruction);

    if (!calculation) {
      throw new Error("Invalid calculation instruction");
    }

    const value = calculate(calculation);

    if (!Number.isFinite(value)) {
      throw new Error("Calculation produced a non-finite result");
    }

    return {
      output: String(value),
      evidence: {
        left: calculation.left,
        operator: calculation.operator,
        right: calculation.right,
        result: value,
      },
    };
  },

  async verify(
    instruction: string,
    result: ToolResult,
  ): Promise<boolean> {
    const calculation = parseCalculation(instruction);

    if (!calculation) {
      return false;
    }

    try {
      const expected = calculate(calculation);
      const actual = Number(result.output);

      return (
        Number.isFinite(actual) &&
        actual === expected &&
        result.evidence.result === expected
      );
    } catch {
      return false;
    }
  },
};