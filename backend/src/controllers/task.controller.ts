import type { Request, Response } from "express";
import { createTaskSchema } from "../schemas/task.schema.js";
import {
  createTask,
  getAllTasks,
  getTaskById,
} from "../services/task.service.js";
import { cancelTask } from "../services/task.service.js";
import {
  registerActiveTask,
  unregisterActiveTask,
} from "../agent/active-tasks.js";
import { cancelActiveTask } from "../agent/active-tasks.js";
export async function createTaskController(
  req: Request,
  res: Response,
): Promise<void> {
  const result = createTaskSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: "Invalid request",
      details: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const task = await createTask(result.data);

  res.status(201).json({
    message: "Task created successfully",
    task,
  });
}

export async function getTaskController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params.id;

  if (typeof id !== "string") {
    res.status(400).json({
      error: "Invalid task ID",
    });
    return;
  }

  const task = await getTaskById(id);

  if (!task) {
    res.status(404).json({
      error: "Task not found",
    });
    return;
  }

  res.status(200).json({ task });
}

export async function listTasksController(
  _req: Request,
  res: Response,
): Promise<void> {
  const tasks = await getAllTasks();

  res.status(200).json({ tasks });
}
export async function cancelTaskController(
  req: Request,
  res: Response,
  next: (error?: unknown) => void,
): Promise<void> {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !id) {
      res.status(400).json({
        error: "Task ID is required",
      });
      return;
    }

    // Signal an active execution to stop.
    cancelActiveTask(id);

    const task = await cancelTask(id);

    res.status(200).json({
      message: "Task cancelled successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
}