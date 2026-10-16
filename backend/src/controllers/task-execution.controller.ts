import type { Request, Response } from "express";
import { getTaskById } from "../services/task.service.js";
import { runAgent } from "../agent/runtime.js";
import {
  registerActiveTask,
  unregisterActiveTask,
} from "../agent/active-tasks.js";
export async function executeTaskController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params.id;

  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const task = await getTaskById(id);

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  if (task.status === "running") {
    res.status(409).json({
      error: "Task is already running",
      taskId: id,
    });
    return;
  }

  if (
    task.status === "completed" ||
    task.status === "cancelled"
  ) {
    res.status(409).json({
      error: `Cannot execute a ${task.status} task`,
      taskId: id,
    });
    return;
  }

  const controller = registerActiveTask(id);

try {
  const result = await runAgent(
    id,
    task.instruction,
    controller.signal,
  );

  res.status(200).json({
    message: "Task execution finished",
    taskId: id,
    result,
  });
} catch (error) {
  console.error("Task execution failed:", error);
  res.status(500).json({
    error: "Task execution failed",
    taskId: id,
    message:
      error instanceof Error
        ? error.message
        : "Unknown execution error",
  });
} finally {
  unregisterActiveTask(id);
}
}