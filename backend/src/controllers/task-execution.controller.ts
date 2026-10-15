import type { Request, Response } from "express";
import { executeTask } from "../services/task-execution.service.js";

export async function executeTaskController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params.id;

  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  try {
    await executeTask(id);

    res.status(200).json({
      message: "Task execution completed",
      taskId: id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (message === "Task not found") {
      res.status(404).json({ error: message });
      return;
    }

    res.status(409).json({ error: message });
  }
}