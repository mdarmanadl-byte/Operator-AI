export type TaskStatus =
  | "pending"
  | "running"
  | "waiting_for_input"
  | "completed"
  | "failed"
  | "cancelled";

export interface Task {
  id: string;
  instruction: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  instruction: string;
}

export interface TaskStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
}