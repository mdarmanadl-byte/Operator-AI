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
    status:
      | "pending"
      | "running"
      | "waiting_for_input"
      | "completed"
      | "failed"
      | "cancelled";
    result?: unknown;
    completedAt?: Date;
  },
) {
  const updateData = {
    status: data.status,
    ...(data.result !== undefined && {
      result: JSON.parse(JSON.stringify(data.result)),
    }),
    ...(data.completedAt !== undefined && {
      completedAt: data.completedAt,
    }),
  };

  const result = await prisma.task.updateMany({
    where: {
      id,
      ...(data.status === "cancelled"
        ? {
            status: {
              in: [
                "pending",
                "running",
                "waiting_for_input",
                "cancelled",
              ],
            },
          }
        : {
            status: {
              notIn: ["completed", "failed", "cancelled"],
            },
          }),
    },
    data: updateData,
  });

  const task = await prisma.task.findUnique({
    where: { id },
  });

  if (!task) {
    throw new Error(`Task "${id}" not found`);
  }

  if (result.count === 0 && task.status !== data.status) {
    if (task.status === "cancelled") {
      throw new Error("Task execution cancelled");
    }

    throw new Error(
      `Cannot transition task from "${task.status}" to "${data.status}"`,
    );
  }

  return task;
}
export async function cancelTask(id: string) {
  const result = await prisma.task.updateMany({
    where: {
      id,
      status: {
        in: ["pending", "running", "waiting_for_input"],
      },
    },
    data: {
      status: "cancelled",
      completedAt: new Date(),
    },
  });

  if (result.count === 1) {
    return prisma.task.findUnique({
      where: { id },
    });
  }

  const task = await prisma.task.findUnique({
    where: { id },
  });

  if (!task) {
    throw new Error(`Task "${id}" not found`);
  }

  throw new Error(
    `Cannot cancel task with status "${task.status}"`,
  );
}