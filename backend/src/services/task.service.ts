import  prisma  from "../lib/prisma.js";
import type { CreateTaskInput } from "../types/task.types.js";

export async function createTask(input: CreateTaskInput) {
  return prisma.task.create({
    data: {
      instruction: input.instruction,
      status: "pending",
    },
  });
}

export async function getTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
  });
}

export async function getAllTasks() {
  return prisma.task.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function clearTasks(): Promise<void> {
  await prisma.task.deleteMany();
}
export async function updateTaskExecution(
  id: string,
  data: {
    status: "running" | "completed" | "failed";
    result?: unknown;
    completedAt?: Date;
  },
) {
  return prisma.task.update({
    where: { id },
    data: {
      status: data.status,
      ...(data.result !== undefined && {
        result: JSON.parse(JSON.stringify(data.result)),
      }),
      ...(data.completedAt !== undefined && {
        completedAt: data.completedAt,
      }),
    },
  });
}