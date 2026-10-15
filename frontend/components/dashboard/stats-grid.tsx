import type { Task } from "@/types/task";

type Props = { tasks: Task[] };
const is = (status: string, expected: string) => status.toLowerCase() === expected;

export default function StatsGrid({ tasks }: Props) {
  const stats = [
    { label: "Total Tasks", value: tasks.length, icon: "▤", tone: "green" },
    { label: "Running", value: tasks.filter((t) => is(t.status, "running")).length, icon: "▶", tone: "blue" },
    { label: "Completed", value: tasks.filter((t) => is(t.status, "completed")).length, icon: "✓", tone: "green" },
    { label: "Failed", value: tasks.filter((t) => is(t.status, "failed")).length, icon: "!", tone: "red" },
  ];
  return (
    <section className="stats-grid" aria-label="Task statistics">
      {stats.map((stat) => (
        <article className="stat-card" key={stat.label}>
          <div className="stat-top"><span>{stat.label}</span><span className={`stat-icon ${stat.tone}`}>{stat.icon}</span></div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-foot"><span /> Live task overview</div>
        </article>
      ))}
    </section>
  );
}
