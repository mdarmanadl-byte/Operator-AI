import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { getTaskEvents } from "../services/task-event.service.js";

export async function getTaskEventsController(
  req: Request,
  res: Response,
): Promise<void> {
  const id = req.params.id;

  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const events = await getTaskEvents(id);

    res.status(200).json({ events });
  } catch (error) {
    console.error("Failed to retrieve task events:", error);

    res.status(500).json({
      error: "Failed to retrieve task events",
    });
  }
}