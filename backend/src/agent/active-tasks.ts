const activeTasks = new Map<string, AbortController>();

export function registerActiveTask(
  taskId: string,
): AbortController {
  const existing = activeTasks.get(taskId);

  if (existing) {
    throw new Error(`Task "${taskId}" is already running`);
  }

  const controller = new AbortController();
  activeTasks.set(taskId, controller);

  return controller;
}

export function cancelActiveTask(taskId: string): boolean {
  const controller = activeTasks.get(taskId);

  if (!controller) {
    return false;
  }

  controller.abort();
  return true;
}

export function unregisterActiveTask(taskId: string): void {
  activeTasks.delete(taskId);
}