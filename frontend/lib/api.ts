import type { CreateTaskInput, Task, TaskEvent } from "@/types/task";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1").replace(/\/$/, "");

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? body?.message ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getTasks(): Promise<Task[]> {
  const result = await request<{ tasks: Task[] } | Task[]>("/tasks");
  return Array.isArray(result) ? result : result.tasks;
}

export async function getTask(id: string): Promise<Task> {
  const result = await request<{ task: Task }>(`/tasks/${encodeURIComponent(id)}`);
  return result.task;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const result = await request<{ task: Task }>("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return result.task;
}

export async function executeTask(taskId: string): Promise<void> {
  await request(`/tasks/${encodeURIComponent(taskId)}/execute`, { method: "POST" });
}

export async function getTaskEvents(taskId: string): Promise<TaskEvent[]> {
  const result = await request<{ events: TaskEvent[] } | TaskEvent[]>(
    `/tasks/${encodeURIComponent(taskId)}/events`,
  );
  return Array.isArray(result) ? result : result.events;
}
