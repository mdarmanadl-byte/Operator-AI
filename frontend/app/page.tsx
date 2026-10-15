"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createTask,
  executeTask,
  getTask,
  listTasks,
  type Task,
} from "@/lib/api";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  running: "bg-blue-100 text-blue-800",
  waiting_for_input: "bg-purple-100 text-purple-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function Home() {
  const [instruction, setInstruction] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = useCallback(async () => {
    const latest = await listTasks();
    setTasks(latest);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const latest = await listTasks();

        if (active) {
          setTasks(latest);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not connect to the backend",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const hasRunningTasks = tasks.some(
      (task) =>
        task.status === "pending" || task.status === "running",
    );

    if (!hasRunningTasks) return;

    const timer = window.setInterval(() => {
      void refreshTasks().catch(() => {});
    }, 2000);

    return () => window.clearInterval(timer);
  }, [tasks, refreshTasks]);

  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const value = instruction.trim();

    if (!value || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const task = await createTask(value);

      setInstruction("");
      setSelectedTaskId(task.id);

      await refreshTasks();

      try {
        await executeTask(task.id);
      } catch {
        // Execution may return an error when a tool fails.
        // Refresh the task so its actual final status is displayed.
      }

      const updated = await getTask(task.id);

      setTasks((current) => [
        updated,
        ...current.filter((item) => item.id !== updated.id),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit the task",
      );

      try {
        await refreshTasks();
      } catch {
        // Preserve the original error.
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRefresh() {
    setError(null);

    try {
      await refreshTasks();

      if (selectedTaskId) {
        const updated = await getTask(selectedTaskId);

        setTasks((current) =>
          current.map((task) =>
            task.id === updated.id ? updated : task,
          ),
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to refresh tasks",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 font-bold">
                O
              </div>

              <h1 className="text-2xl font-bold tracking-tight">
                Operator AI
              </h1>
            </div>

            <p className="text-sm text-slate-400">
              Autonomous task execution workspace
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Local workspace
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total tasks",
              value: tasks.length,
            },
            {
              label: "Running",
              value: tasks.filter((t) => t.status === "running").length,
            },
            {
              label: "Completed",
              value: tasks.filter((t) => t.status === "completed").length,
            },
            {
              label: "Failed",
              value: tasks.filter((t) => t.status === "failed").length,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Create a task</h2>
            <p className="mt-1 text-sm text-slate-400">
              Describe the action you want Operator AI to perform.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="instruction"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Task instruction
            </label>

            <textarea
              id="instruction"
              value={instruction}
              onChange={(event) =>
                setInstruction(event.target.value)
              }
              placeholder="Example: calculate 12 * 7"
              rows={3}
              maxLength={5000}
              required
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {instruction.length}/5000 characters
              </span>

              <button
                type="submit"
                disabled={submitting || !instruction.trim()}
                className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Executing..." : "Run task"}
              </button>
            </div>
          </form>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-900 bg-red-950/50 p-4 text-sm text-red-300"
            >
              {error}
            </div>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div>
                <h2 className="font-semibold">Task history</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Tasks retrieved from your backend
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleRefresh()}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <p className="p-8 text-sm text-slate-400">
                Loading tasks...
              </p>
            ) : tasks.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-medium">No tasks yet</p>
                <p className="mt-2 text-sm text-slate-400">
                  Submit your first task to get started.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`block w-full p-5 text-left transition hover:bg-slate-800/70 ${
                      selectedTaskId === task.id
                        ? "bg-slate-800"
                        : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="max-w-xl text-sm font-medium">
                        {task.instruction}
                      </p>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyles[task.status] ??
                          "bg-slate-700 text-slate-200"
                        }`}
                      >
                        {task.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      {formatDate(task.createdAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="font-semibold">Task details</h2>

            {!selectedTask ? (
              <p className="mt-6 text-sm text-slate-400">
                Select a task to inspect its details.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Instruction
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    {selectedTask.instruction}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Status
                  </p>

                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      statusStyles[selectedTask.status] ??
                      "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {selectedTask.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Task ID
                  </p>

                  <p className="mt-2 break-all font-mono text-xs text-slate-400">
                    {selectedTask.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Created
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {formatDate(selectedTask.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Last updated
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {formatDate(selectedTask.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          Operator AI · Task execution backed by PostgreSQL
        </footer>
      </div>
    </main>
  );
}