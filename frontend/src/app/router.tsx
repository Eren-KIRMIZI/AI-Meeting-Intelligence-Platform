import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { NovaMark } from '@/components/common/nova-mark';
import { useAuth } from '@/features/auth/auth-provider';
import { LoginPage } from '@/features/auth/LoginPage';
import { NotFoundPage } from '@/features/auth/NotFoundPage';

// Route-level code splitting keeps the first paint small: the workspace shell,
// auth and login load immediately, and each module arrives on first visit.
// AppLayout provides the Suspense boundary for the pages inside the shell.
const OverviewPage = lazy(() =>
  import('@/features/overview/OverviewPage').then((module) => ({
    default: module.OverviewPage,
  }))
);
const ProjectsPage = lazy(() =>
  import('@/features/projects/ProjectsPage').then((module) => ({
    default: module.ProjectsPage,
  }))
);
const ProjectDetailPage = lazy(() =>
  import('@/features/projects/ProjectDetailPage').then((module) => ({
    default: module.ProjectDetailPage,
  }))
);
const TasksPage = lazy(() =>
  import('@/features/tasks/TasksPage').then((module) => ({
    default: module.TasksPage,
  }))
);
const MeetingsPage = lazy(() =>
  import('@/features/meetings/MeetingsPage').then((module) => ({
    default: module.MeetingsPage,
  }))
);
const MeetingDetailPage = lazy(() =>
  import('@/features/meetings/MeetingDetailPage').then((module) => ({
    default: module.MeetingDetailPage,
  }))
);
const LiveLobbyPage = lazy(() =>
  import('@/features/live/LiveLobbyPage').then((module) => ({
    default: module.LiveLobbyPage,
  }))
);
const LiveRoomPage = lazy(() =>
  import('@/features/live/LiveRoomPage').then((module) => ({
    default: module.LiveRoomPage,
  }))
);
const DecisionsPage = lazy(() =>
  import('@/features/decisions/DecisionsPage').then((module) => ({
    default: module.DecisionsPage,
  }))
);
const KnowledgePage = lazy(() =>
  import('@/features/knowledge/KnowledgePage').then((module) => ({
    default: module.KnowledgePage,
  }))
);
const WorkflowsPage = lazy(() =>
  import('@/features/workflows/WorkflowsPage').then((module) => ({
    default: module.WorkflowsPage,
  }))
);
const IntelligencePage = lazy(() =>
  import('@/features/intelligence/IntelligencePage').then((module) => ({
    default: module.IntelligencePage,
  }))
);
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/AnalyticsPage').then((module) => ({
    default: module.AnalyticsPage,
  }))
);
const TeamPage = lazy(() =>
  import('@/features/team/TeamPage').then((module) => ({
    default: module.TeamPage,
  }))
);
const SettingsPage = lazy(() =>
  import('@/features/settings/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  }))
);

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
        <NovaMark className="h-5 w-5" />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading your workspace
      </div>
    </div>
  );
}

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route
          path="/live/:roomId"
          element={
            <Suspense fallback={<AuthLoadingScreen />}>
              <LiveRoomPage />
            </Suspense>
          }
        />

        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/meetings/:meetingId" element={<MeetingDetailPage />} />
          <Route path="/live" element={<LiveLobbyPage />} />
          <Route path="/decisions" element={<DecisionsPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
