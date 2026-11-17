import { useState } from 'react';
import {
  Archive,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Clock3,
  FileText,
  Filter,
  FolderKanban,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react';

type Project = {
  name: string;
  label: string;
  labelColor: string;
  description: string;
  progress: number;
  members: string[];
  status: string;
  tone: string;
};

const navItems = [
  { label: 'Overview', icon: LayoutGrid },
  { label: 'My work', icon: List },
  { label: 'Projects', icon: FolderKanban },
  { label: 'Meetings', icon: CalendarDays },
  { label: 'Knowledge', icon: FileText },
  { label: 'Decisions', icon: Target },
  { label: 'Automations', icon: Zap },
  { label: 'Team', icon: Users },
];

const projects: Project[] = [
  { name: 'Pulse mobile app', label: 'Product', labelColor: 'blue', description: 'Ship the next generation of the customer experience.', progress: 68, members: ['AK', 'SY', 'RM', 'EO'], status: 'On track', tone: 'blue' },
  { name: 'Q4 brand refresh', label: 'Marketing', labelColor: 'orange', description: 'A clearer story for our most important launch.', progress: 42, members: ['NA', 'LG', 'BM'], status: 'At risk', tone: 'orange' },
  { name: 'Customer insight hub', label: 'Research', labelColor: 'mint', description: 'Turn conversations into decisions the team can act on.', progress: 84, members: ['DT', 'YK', 'AS', 'JK'], status: 'On track', tone: 'mint' },
];

const updates = [
  { initials: 'SY', color: 'coral', title: 'Task completed', text: 'Sarah completed “Finalize onboarding flow”.', time: '12 min' },
  { initials: 'NA', color: 'violet', title: 'New decision', text: 'The team agreed on the launch timeline.', time: '38 min' },
  { initials: 'RM', color: 'gold', title: 'Meeting summary ready', text: 'Product sync has 4 action items to review.', time: '1 hr' },
  { initials: 'EO', color: 'blue', title: 'Comment added', text: 'Emre commented on “Customer insight hub”.', time: '2 hr' },
];

function AvatarStack({ members }: { members: string[] }) {
  return <div className="avatar-stack">{members.map((member, index) => <span className={`avatar avatar-${index}`} key={member}>{member}</span>)}</div>;
}

function App() {
  const [activeNav, setActiveNav] = useState('Overview');
  const [view, setView] = useState<'Blocks' | 'Lists'>('Blocks');
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><Sparkles size={20} strokeWidth={2.5} /></div>
        <div className="workspace-switcher"><span className="workspace-dot">N</span><span>Nova workspace</span><ChevronDown size={14} /></div>
        <nav className="main-nav">
          <span className="nav-caption">WORKSPACE</span>
          {navItems.map(({ label, icon: Icon }) => <button className={`nav-item ${activeNav === label ? 'active' : ''}`} key={label} onClick={() => setActiveNav(label)}><Icon size={17} /><span>{label}</span>{label === 'Inbox' && <b>4</b>}</button>)}
          <span className="nav-caption nav-caption-spaced">MANAGE</span>
          <button className="nav-item"><Archive size={17} /><span>Archive</span></button>
          <button className="nav-item"><Settings size={17} /><span>Settings</span></button>
        </nav>
        <div className="sidebar-bottom"><div className="ai-promo"><div className="ai-icon"><Sparkles size={15} /></div><div><strong>Ask Nova</strong><span>Your workspace copilot</span></div><ChevronRight size={15} /></div><div className="profile"><span className="avatar avatar-profile">AY</span><div><strong>Ayşe Yılmaz</strong><span>Product lead</span></div><MoreHorizontal size={16} /></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs"><span>Home</span><ChevronRight size={13} /><strong>{activeNav}</strong></div><div className="top-actions"><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search anything..." /><kbd>⌘ K</kbd></div><button className="icon-button"><Bell size={18} /><span className="notification-dot" /></button><button className="top-profile"><span className="avatar avatar-profile">AY</span><ChevronDown size={15} /></button></div></header>

        <div className="page-content">
          <div className="page-heading"><div><div className="eyebrow"><span className="live-dot" /> Monday, November 16, 2026</div><h1>Good morning, Ayşe <span>✦</span></h1><p>Here is what changed across your workspace while you were away.</p></div><button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={16} /> New project</button></div>

          <section className="insight-banner"><div className="insight-symbol"><Sparkles size={19} /></div><div className="insight-copy"><strong>Your workspace at a glance</strong><span>4 decisions need attention · 2 projects may need a closer look this week</span></div><button className="text-button">View insights <ChevronRight size={15} /></button></section>

          <div className="section-toolbar"><div className="view-tabs"><button className={view === 'Blocks' ? 'selected' : ''} onClick={() => setView('Blocks')}><LayoutGrid size={15} /> Blocks</button><button className={view === 'Lists' ? 'selected' : ''} onClick={() => setView('Lists')}><List size={15} /> Lists</button></div><div className="toolbar-actions"><button className="secondary-button"><Filter size={15} /> Filter <span className="filter-count">2</span></button><button className="secondary-button"><CalendarDays size={15} /> This week <ChevronDown size={14} /></button></div></div>

          <section className="metric-grid"><MetricCard icon={<FolderKanban size={17} />} label="Active projects" value="12" change="+2" note="vs last week" tone="blue" spark="blue" /><MetricCard icon={<CircleCheck size={17} />} label="Tasks completed" value="48" change="16.5%" note="this week" tone="mint" spark="mint" /><MetricCard icon={<Clock3 size={17} />} label="Upcoming deadlines" value="09" change="next 2 weeks" note="across 5 projects" tone="orange" spark="orange" /><MetricCard icon={<CircleHelp size={17} />} label="Needs attention" value="04" change="2 overdue" note="since yesterday" tone="coral" spark="coral" /></section>

          <div className="content-grid"><section className="projects-section"><div className="section-title-row"><div><span className="section-kicker">PROJECT PULSE</span><h2>Work in motion</h2></div><button className="ghost-button">View all <ChevronRight size={15} /></button></div><div className={view === 'Blocks' ? 'project-grid' : 'project-list'}>{projects.filter((project) => project.name.toLowerCase().includes(search.toLowerCase())).map((project) => <ProjectCard project={project} key={project.name} />)}</div><div className="timeline-card"><div className="section-title-row"><div><span className="section-kicker">UP NEXT</span><h2>Schedule</h2></div><button className="ghost-button">Open calendar <ChevronRight size={15} /></button></div><div className="schedule"><div className="schedule-days"><span>MON <b>16</b></span><span className="today">TUE <b>17</b></span><span>WED <b>18</b></span><span>THU <b>19</b></span><span>FRI <b>20</b></span></div><div className="schedule-event"><div className="event-time">10:00</div><div className="event-line" /><div className="event-content"><div className="event-icon"><Users size={16} /></div><div><strong>Weekly product sync</strong><span>Pulse mobile app · 45 min</span></div><AvatarStack members={['AY', 'SY', 'RM']} /></div></div><div className="schedule-event"><div className="event-time">14:30</div><div className="event-line muted" /><div className="event-content"><div className="event-icon violet"><FileText size={16} /></div><div><strong>Decision review</strong><span>Leadership room · 30 min</span></div><AvatarStack members={['AY', 'NA']} /></div></div></div></div></section><aside className="right-column"><div className="section-title-row"><div><span className="section-kicker">ACTIVITY</span><h2>Latest updates</h2></div><button className="more-button"><MoreHorizontal size={18} /></button></div><div className="updates-card">{updates.map((update) => <div className="update-item" key={update.title}><span className={`avatar avatar-${update.color}`}>{update.initials}</span><div className="update-copy"><div><strong>{update.title}</strong><time>{update.time}</time></div><p>{update.text}</p></div></div>)}<button className="updates-footer">See all activity <ChevronRight size={15} /></button></div><div className="copilot-card"><div className="copilot-glow" /><div className="copilot-header"><div className="ai-icon"><Sparkles size={15} /></div><span>Workspace copilot</span><span className="online"><i /> Ready</span></div><h3>What would you like to know?</h3><div className="prompt-list"><button>What changed this week? <ChevronRight size={14} /></button><button>Which decisions are blocked? <ChevronRight size={14} /></button></div><button className="ask-button"><Sparkles size={15} /> Ask Nova anything</button></div></aside></div>
        </div>
      </main>
      {showAdd && <div className="modal-backdrop" onClick={() => setShowAdd(false)}><div className="modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowAdd(false)}><X size={18} /></button><div className="modal-symbol"><FolderKanban size={20} /></div><h2>Create a new project</h2><p>Start a focused space for your team to move work forward.</p><input autoFocus placeholder="Project name" /><div className="modal-actions"><button className="secondary-button" onClick={() => setShowAdd(false)}>Cancel</button><button className="primary-button" onClick={() => setShowAdd(false)}>Create project</button></div></div></div>}
    </div>
  );
}

function MetricCard({ icon, label, value, change, note, tone, spark }: { icon: React.ReactNode; label: string; value: string; change: string; note: string; tone: string; spark: string }) {
  return <div className={`metric-card tone-${tone}`}><div className="metric-top"><span className="metric-icon">{icon}</span><span className="metric-label">{label}</span><MoreHorizontal size={16} className="metric-more" /></div><div className="metric-bottom"><div><strong>{value}</strong><span>{change} <small>{note}</small></span></div><div className={`sparkline ${spark}`}><i /><i /><i /><i /><i /><i /><i /></div></div></div>;
}

function ProjectCard({ project }: { project: Project }) {
  return <article className="project-card"><div className={`project-color ${project.tone}`} /><div className="project-card-body"><div className="project-top"><span className={`project-label ${project.labelColor}`}>{project.label}</span><button className="more-button"><MoreHorizontal size={17} /></button></div><h3>{project.name}</h3><p>{project.description}</p><div className="progress-row"><span>Progress</span><b>{project.progress}%</b></div><div className="progress-track"><span style={{ width: `${project.progress}%` }} /></div><div className="project-footer"><AvatarStack members={project.members} /><span className={`status ${project.status === 'At risk' ? 'risk' : ''}`}><i /> {project.status}</span></div></div></article>;
}

export default App;
