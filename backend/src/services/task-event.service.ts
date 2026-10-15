import prisma from "../lib/prisma.js";

export async function recordTaskEvent(
  taskId: string,
  type: string,
  message: string,
) {
  return prisma.taskEvent.create({
    data: {
      taskId,
      type,
      message,
    },
  });
}

export async function getTaskEvents(taskId: string) {
  return prisma.taskEvent.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
  });
}