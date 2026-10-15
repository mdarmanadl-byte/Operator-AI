import { prisma } from "../lib/prisma.js";
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