import { describe, expect, it } from "vitest";

import {
  createAgentState,
  recordStepFailure,
  recordStepResult,
} from "../src/agent/state.js";

describe("Agent state", () => {
  it("initializes every planned step as pending", () => {
    const state = createAgentState(
      "task-1",
      "Qualify a CRM contact",
      [
        {
          id: "step-1",
          tool: "browser",
          instruction: "Find Rahul Sharma",
        },
        {
          id: "step-2",
          tool: "browser",
          instruction: "Mark the contact qualified",
        },
      ],
    );

    expect(state.status).toBe("running");
    expect(state.steps).toHaveLength(2);

    expect(
      state.steps.every((step) => step.status === "pending"),
    ).toBe(true);
  });

  it("records successful tool results", () => {
    const state = createAgentState(
      "task-2",
      "Calculate 12 * 8",
      [
        {
          id: "step-1",
          tool: "calculator",
          instruction: "Calculate 12 * 8",
        },
      ],
    );

    const step = state.steps[0];

    recordStepResult(step, {
      output: "96",
      evidence: { expression: "12 * 8" },
    });

    expect(step.status).toBe("completed");
    expect(step.output).toBe("96");
    expect(step.evidence).toEqual({
      expression: "12 * 8",
    });
  });

  it("records failures without hiding the error", () => {
    const state = createAgentState(
      "task-3",
      "Run a browser task",
      [
        {
          id: "step-1",
          tool: "browser",
          instruction: "Find the requested contact",
        },
      ],
    );

    recordStepFailure(
      state.steps[0],
      new Error("Contact not found"),
    );

    expect(state.steps[0].status).toBe("failed");
    expect(state.steps[0].error).toBe("Contact not found");
  });

  it("rejects an empty plan", () => {
    expect(() =>
      createAgentState("task-4", "Empty task", []),
    ).toThrow("Execution plan must contain at least one step");
  });
});