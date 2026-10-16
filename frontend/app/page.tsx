"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import StatsGrid from "@/components/dashboard/stats-grid";
import TaskForm from "@/components/dashboard/task-form";
import TaskHistory from "@/components/dashboard/task-history";
import TaskDetails from "@/components/dashboard/task-details";
import { createTask, executeTask, getTasks,cancelTask } from "@/lib/api";
import type { Task } from "@/types/task";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);


  async function handleCancel(task: Task): Promise<void> {
  if (cancelling) return;

  const confirmed = window.confirm(
    "Are you sure you want to cancel this task?"
  );

  if (!confirmed) return;

  setCancelling(true);
  setError("");

  try {
    await cancelTask(task.id);
    await refreshTasks(true);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Task cancellation failed."
    );
  } finally {
    setCancelling(false);
  }
}

  const refreshTasks = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const latest = await getTasks();
      setTasks(latest);
      setSelectedTask((current) =>
        current ? latest.find((task) => task.id === current.id) ?? latest[0] ?? null : latest[0] ?? null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to the backend.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { void refreshTasks(); }, [refreshTasks]);

  async function handleCreate(instruction: string) {
    setCreating(true);
  setError("");

  try {
    const task = await createTask({ instruction });

    setTasks((current) => [
      task,
      ...current.filter((item) => item.id !== task.id),
    ]);
    setSelectedTask(task);

    // Automatically execute the newly created task.
    setExecuting(true);
    await executeTask(task.id);

    await refreshTasks(true);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Task execution failed.",
    );
    throw err;
  } finally {
    setCreating(false);
    setExecuting(false);
  }
  }

  async function handleExecute(task: Task) {
    setExecuting(true);
    setError("");
    try {
      await executeTask(task.id);
      await refreshTasks(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Task execution failed.");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="app-shell">
      <DashboardSidebar />
      <div className="dashboard-main">
        <DashboardHeader onRefresh={() => void refreshTasks()} />
        <main className="dashboard-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">CONTROL CENTER</p>
              <h1>Welcome <span>back!</span></h1>
              <p className="welcome-copy">Describe a task and let Operator AI handle it.</p>
            </div>
            <div className="system-ready">
              <span className="pulse-dot" />
              <div><strong>System Ready</strong><small>Task workspace</small></div>
            </div>
          </section>

          {error && (
            <div className="error-banner" role="alert">
              <span className="error-mark">!</span>
              <div><strong>Something needs attention</strong><p>{error}</p></div>
              <button className="button button-quiet" onClick={() => void refreshTasks()}>Retry</button>
            </div>
          )}

          <StatsGrid tasks={tasks} />

          <TaskForm onSubmit={handleCreate} submitting={creating} />

          <section className="lower-grid">
            <TaskHistory
              tasks={tasks}
              selectedTaskId={selectedTask?.id ?? null}
              loading={loading}
              onSelect={setSelectedTask}
              onRefresh={() => void refreshTasks()}
            />
            <TaskDetails
              task={selectedTask}
              onExecute={handleExecute}
              executing={executing}
  onCancel={handleCancel}
  cancelling={cancelling}
            />
          </section>

          <footer className="dashboard-footer">
            <span className="footer-brand"><span className="brand-bolt">ϟ</span> OPERATOR AI</span>
            <span>Autonomous task execution <i /> Version 0.1.0</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
