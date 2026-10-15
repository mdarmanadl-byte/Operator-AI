"use client";

import { useEffect, useState } from "react";
import {
  getTaskEvents,
  type TaskEvent,
} from "@/lib/api";

interface Props {
  taskId: string;
  taskStatus: string;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleTimeString();
}

function getEventStyle(type: string): string {
  if (
    type.includes("failed") ||
    type.includes("error")
  ) {
    return "timeline-dot-failed";
  }

  if (
    type.includes("completed") ||
    type.includes("passed")
  ) {
    return "timeline-dot-completed";
  }

  return "timeline-dot-running";
}

export default function ExecutionTimeline({
  taskId,
  taskStatus,
}: Props) {
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        const result = await getTaskEvents(taskId);

        if (active) {
          setEvents(result);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load execution events",
          );
        }
      }
    }

    void loadEvents();

    if (
      taskStatus === "pending" ||
      taskStatus === "running"
    ) {
      const timer = window.setInterval(
        () => void loadEvents(),
        1500,
      );

      return () => {
        active = false;
        window.clearInterval(timer);
      };
    }

    return () => {
      active = false;
    };
  }, [taskId, taskStatus]);

  return (
    <section className="execution-timeline">
      <div className="execution-timeline-heading">
        <h3>Execution timeline</h3>
        <span>Recorded actions and verification events</span>
      </div>

      {error && (
        <p role="alert" className="timeline-error">
          {error}
        </p>
      )}

      {!error && events.length === 0 && (
        <p className="timeline-empty">
          No execution events have been recorded yet.
        </p>
      )}

      <ol className="timeline-list">
        {events.map((event) => (
          <li key={event.id} className="timeline-item">
            <div
              className={`timeline-dot ${getEventStyle(event.type)}`}
            />

            <div className="timeline-event-content">
              <div className="timeline-event-topline">
                <p>
                  {event.type.replaceAll("_", " ")}
                </p>

                <time>
                  {formatTimestamp(event.createdAt)}
                </time>
              </div>

              <p className="timeline-message">
                {event.message}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}