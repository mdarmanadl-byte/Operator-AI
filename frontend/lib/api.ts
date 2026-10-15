const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000/api/v1";

export interface Task {
  id: string;
  instruction: string;
  status:
    | "pending"
    | "running"
    | "waiting_for_input"
    | "completed"
    | "failed"
    | "cancelled";
  createdAt: string;
  updatedAt: string;
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ?? `Request failed: ${response.status}`,
    );
  }

  return data as T;
}

export async function listTasks(): Promise<Task[]> {
  const result = await request<{ tasks: Task[] }>("/tasks");
  return result.tasks;
}

export async function createTask(
  instruction: string,
): Promise<Task> {
  const result = await request<{ task: Task }>("/tasks", {
    method: "POST",
    body: JSON.stringify({ instruction }),
  });

  return result.task;
}

export async function executeTask(
  taskId: string,
): Promise<void> {
  await request(`/tasks/${taskId}/execute`, {
    method: "POST",
  });
}

export async function getTask(
  taskId: string,
): Promise<Task> {
  const result = await request<{ task: Task }>(
    `/tasks/${taskId}`,
  );

  return result.task;
}