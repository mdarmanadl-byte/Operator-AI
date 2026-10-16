import prisma from "../lib/prisma.js";
import { runAgent } from "../agent/runtime.js";
import "../agent/register-tools.js";
import { recordTaskEvent } from "./task-event.service.js";
import {
  registerActiveTask,
  unregisterActiveTask,
} from "../agent/active-tasks.js";

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

   const controller = registerActiveTask(task.id);

try {
  const result = await runAgent(
    task.id,
    task.instruction,
    controller.signal,
  );

  await recordTaskEvent(
    task.id,
    "agent_result",
    JSON.stringify({
      output: result.output,
      evidence: result.evidence,
    }),
  );

  // Iske baad ka existing code bhi try block ke andar rakho.
} finally {
  unregisterActiveTask(task.id);
}

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
    console.error("Task execution error:", error);
    throw error;
  }
}