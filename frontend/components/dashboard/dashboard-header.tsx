type Props = { onRefresh: () => void };

export default function DashboardHeader({ onRefresh }: Props) {
  return (
    <header className="dashboard-header">
      <div className="breadcrumb">Workspace&nbsp; / &nbsp;<b>Dashboard</b></div>
      <div className="topbar-right">
        <div className="search-box"><span>⌕</span><span>Workspace overview</span><kbd>⌘ K</kbd></div>
        <div className="connected-pill"><span /> Connected</div>
        <button className="icon-button" type="button" onClick={onRefresh} aria-label="Refresh tasks" title="Refresh tasks">↻</button>
      </div>
    </header>
  );
}
