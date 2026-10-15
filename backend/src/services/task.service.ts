import { randomUUID } from "node:crypto";
import type {
  CreateTaskInput,
  Task,
} from "../types/task.types.js";

const tasks = new Map<string, Task>();

export function createTask(input: CreateTaskInput): Task {
  const now = new Date().toISOString();

  const task: Task = {
    id: randomUUID(),
    instruction: input.instruction,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  tasks.set(task.id, task);

  return task;
}

export function getTaskById(id: string): Task | undefined {
  return tasks.get(id);
}

export function getAllTasks(): Task[] {
  return Array.from(tasks.values()).reverse();
}