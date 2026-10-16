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
  error?: string | Record<string, any>;  
  result?: string | Record<string, any>; 
  output?: string | Record<string, any>; 
}

export interface CreateTaskInput {
  instruction: string;
}

export interface TaskStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
}
export type TaskEvent = {
  id: string;
  taskId: string;
  type: TaskEventType;
  message: string ;
  createdAt: string;
};
export type TaskEventType = 
  | "task_created" 
  | "execution_started" 
  | "execution_completed" 
  | "execution_failed" 
  | "tool_started" 
  | "tool_completed" 
  | string;

interface TaskDetailsProps {
  task: Task | null;
  onExecute: (task: Task) => void;
  executing: boolean;
  onCancel: (task: Task) => void;
  cancelling: boolean;
}