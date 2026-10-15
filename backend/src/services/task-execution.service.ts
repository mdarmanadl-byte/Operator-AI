import prisma from "../lib/prisma.js";
import { findTool } from "../agent/tool-registry.js";
import "../agent/register-tools.js";
import { recordTaskEvent } from "./task-event.service.js";

export async function executeTask(taskId: string): Promise<void> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  if (task.status !== "pending") {
    throw new Error(
      `Cannot execute task with status "${task.status}"`,
    );
  }

  const claimed = await prisma.task.updateMany({
    where: {
      id: taskId,
      status: "pending",
    },
    data: {
      status: "running",
    },
  });

  if (claimed.count !== 1) {
    throw new Error("Task is already being executed or is no longer pending");
  }

  try {
    await recordTaskEvent(
      taskId,
      "execution_started",
      "Task execution started",
    );

    const tool = findTool(task.instruction);

    if (!tool) {
      throw new Error(
        "No registered tool can handle this instruction",
      );
    }

    await recordTaskEvent(
      taskId,
      "tool_started",
      `Starting tool: ${tool.name}`,
    );

    const result = await tool.execute(task.instruction);

    await recordTaskEvent(
      taskId,
      "tool_completed",
      `${tool.name} returned: ${result.output}`,
    );

    const verified = await tool.verify(
      task.instruction,
      result,
    );

    if (!verified) {
      throw new Error(
        `Verification failed for tool "${tool.name}"`,
      );
    }

    await recordTaskEvent(
      taskId,
      "verification_passed",
      `Verified result: ${result.output}`,
    );

    await recordTaskEvent(
      taskId,
      "execution_completed",
      JSON.stringify({
        tool: tool.name,
        output: result.output,
        evidence: result.evidence,
      }),
    );

    await prisma.task.update({
      where: { id: taskId },
      data: { status: "completed" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown execution error";

    await prisma.task.update({
      where: { id: taskId },
      data: { status: "failed" },
    });

    await recordTaskEvent(
      taskId,
      "execution_failed",
      message,
    );

    throw error;
  }
}