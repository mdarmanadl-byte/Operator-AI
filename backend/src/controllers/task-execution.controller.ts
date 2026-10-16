import type { Request, Response } from "express";
import { getTaskById } from "../services/task.service.js";
import { runAgent as executeTask } from "../agent/runtime.js";

export async function executeTaskController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params.id;

  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid task ID" });
    try {
      const result = await executeTask(id, task.instruction);

  try {
        message: "Task execution finished",

        result,
    res.status(200).json({
      message: "Task execution completed",
      res.status(500).json({
        error: "Task execution failed",
        taskId: id,
        message:
          error instanceof Error
            ? error.message
            : "Unknown execution error",
      });
    }

    res.status(409).json({ error: message });
  }
}