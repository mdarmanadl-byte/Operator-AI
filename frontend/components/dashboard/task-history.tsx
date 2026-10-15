import type { Task } from "@/types/task";

type Props = {
  tasks: Task[];
  selectedTaskId: string | null;
  loading: boolean;
  onSelect: (task: Task) => void;
  onRefresh: () => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function statusClass(status: string) {
  return `status-badge status-${status.toLowerCase().replace(/[^a-z_]/g, "")}`;
}

export default function TaskHistory({ tasks, selectedTaskId, loading, onSelect, onRefresh }: Props) {
  return (
    <section className="panel history-panel">
      <header className="panel-header">
        <div><h2>◷ &nbsp; Task History</h2><p>All tasks from your workspace</p></div>
        <button className="button button-quiet" type="button" onClick={onRefresh} disabled={loading} aria-label="Refresh task history">{loading ? "Loading…" : "↻ Refresh"}</button>
      </header>
      {loading && tasks.length === 0 ? (
        <div className="empty-state">Loading tasks from your backend…</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state"><strong>No tasks yet</strong>Create your first task above and it will show up here.</div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <button type="button" key={task.id} className={`task-row ${selectedTaskId === task.id ? "selected" : ""}`} onClick={() => onSelect(task)}>
              <span className="task-file-icon">▤</span>
              <span className="task-row-main">
                <span className="task-instruction">{task.instruction}</span>
                <span className="task-date">{formatDate(task.createdAt)}</span>
              </span>
              <span className={statusClass(task.status)}>{task.status.replaceAll("_", " ")}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
