"use client";

import { useEffect, useState } from "react";
import { getTaskEvents } from "@/lib/api";
import type { Task, TaskEvent } from "@/types/task";

type Props = { task: Task | null; onExecute: (task: Task) => Promise<void>; executing: boolean ;onCancel: (task: Task) => Promise<void>;
  cancelling: boolean; };

function dateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function statusClass(status: string) {
  return `status-badge status-${status.toLowerCase().replace(/[^a-z_]/g, "")}`;
}

function eventTone(event: TaskEvent) {
  const text = `${event.type} ${event.message}`.toLowerCase();
  if (text.includes("fail") || text.includes("error")) return "error";
  if (text.includes("tool started") || text.includes("wait")) return "warning";
  return "";
}

function eventTitle(event: TaskEvent) {
  return event.type.replaceAll("_", " ").toLowerCase();
}

// Helper to safely convert strings, objects, or arrays into a clean display string
function formatMessage(val: unknown, fallback: string): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    // If it has an internal message, error, or text property, prefer that
    const obj = val as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.output === "string") return obj.output;
    // Otherwise, pretty-print the JSON object so React can render it as text
    return JSON.stringify(val, null, 2);
  }
  return String(val);
}

export default function TaskDetails({ task, onExecute, executing ,  onCancel,
  cancelling,}: Props) {
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [eventsError, setEventsError] = useState("");

  useEffect(() => {
    let alive = true;
    setEvents([]);
    setEventsError("");
    if (!task) return;
    getTaskEvents(task.id).then((result) => {
      if (alive) setEvents(result);
    }).catch((err) => {
      if (alive) setEventsError(err instanceof Error ? err.message : "Execution events unavailable.");
    });
    return () => { alive = false; };
  }, [task?.id, task?.updatedAt, task?.status]);

  if (!task) {
    return (
      <section className="panel details-panel">
        <div className="panel-header">
          <div><h2>▧ &nbsp; Task Details</h2><p>Inspect the selected task</p></div>
        </div>
        <div className="details-placeholder">
          <div>
            <div className="placeholder-icon">ϟ</div>
            <strong>Select a task to inspect it</strong>
            <p>Choose a task from history to see its status, metadata, and execution timeline.</p>
          </div>
        </div>
      </section>
    );
  }

  const canExecute = ["pending", "failed", "cancelled"].includes(task.status.toLowerCase());
  const canCancel = ["pending", "queued", "running", "in_progress"].includes(
  task.status.toLowerCase()
);
  // Safely map fallback messages using formatMessage so objects never crash React
  const timeline = events.length ? events : [
    { id: "fallback-created", taskId: task.id, type: "task_created", message: "Task added to the workspace.", createdAt: task.createdAt },
    ...(task.status === "running" ? [{ id: "fallback-running", taskId: task.id, type: "execution_started", message: "Task execution is in progress.", createdAt: task.updatedAt }] : []),
    ...(task.status === "completed" ? [{ id: "fallback-complete", taskId: task.id, type: "execution_completed", message: formatMessage(task.result ?? task.output, "Task marked completed by the backend."), createdAt: task.updatedAt }] : []),
    ...(task.status === "failed" ? [{ id: "fallback-failed", taskId: task.id, type: "execution_failed", message: formatMessage(task.error, "The backend marked this task as failed."), createdAt: task.updatedAt }] : []),
  ];

  const displayErrorOrResult = task.error ?? task.result ?? task.output;

  return (
    <section className="panel details-panel">
     <header className="panel-header">
  <div>
    <h2>▧ &nbsp; Task Details</h2>
    <p>Inspect the selected task</p>
  </div>

  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
    {canCancel && (
      <button
        className="button"
        type="button"
        onClick={() => void onCancel(task)}
        disabled={cancelling || executing}
        style={{
          border: "1px solid rgba(239, 68, 68, 0.5)",
          color: "#ef4444",
        }}
      >
        {cancelling ? "Cancelling…" : "✕ Cancel Task"}
      </button>
    )}

    {canExecute && (
      <button
        className="button button-yellow"
        type="button"
        onClick={() => void onExecute(task)}
        disabled={executing || cancelling}
      >
        {executing ? "Executing…" : "▶ Execute Again"}
      </button>
    )}
  </div>
</header>
      <div className="details-body">
        <div className="detail-instruction">
          <div className="detail-label">INSTRUCTION</div>
          <div className="detail-value">{task.instruction}</div>
        </div>
        <div className="detail-meta-grid">
          <div className="detail-meta"><div className="detail-label">STATUS</div><span className={statusClass(task.status)}>{task.status.replaceAll("_", " ")}</span></div>
          <div className="detail-meta"><div className="detail-label">TASK ID</div><div className="detail-value id-value">{task.id}</div></div>
          <div className="detail-meta"><div className="detail-label">CREATED</div><div className="detail-value">{dateTime(task.createdAt)}</div></div>
          <div className="detail-meta"><div className="detail-label">LAST UPDATED</div><div className="detail-value">{dateTime(task.updatedAt)}</div></div>
        </div>

        {displayErrorOrResult && (
          <div className="detail-instruction">
            <div className="detail-label">{task.error ? "ERROR" : "RESULT"}</div>
            <div className="detail-value" style={{ whiteSpace: "pre-wrap" }}>
              {formatMessage(displayErrorOrResult, "")}
            </div>
          </div>
        )}

        <div className="timeline">
          <div className="timeline-heading"><span>▤</span> Execution Timeline</div>
          {eventsError && <div className="empty-state">{eventsError}</div>}
          {!events.length && !eventsError && <div className="empty-state">Showing task state summary; no execution events were returned.</div>}
          <div className="timeline-list">
            {timeline.map((event) => (
              <div className="timeline-event" key={event.id}>
                <span className={`timeline-marker ${eventTone(event)}`}>
                  {eventTone(event) === "error" ? "!" : eventTone(event) === "warning" ? "•" : "✓"}
                </span>
                <div className="timeline-copy">
                  <strong>{eventTitle(event)}</strong>
                  <p style={{ whiteSpace: "pre-wrap" }}>{formatMessage(event.message, "")}</p>
                </div>
                <time className="timeline-time">
                  {new Date(event.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </time>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}