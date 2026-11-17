import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { NovaMark } from '@/components/common/nova-mark';
import { useAuth } from '@/features/auth/auth-provider';
import { LoginPage } from '@/features/auth/LoginPage';
import { NotFoundPage } from '@/features/auth/NotFoundPage';
import { OverviewPage } from '@/features/overview/OverviewPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { MeetingsPage } from '@/features/meetings/MeetingsPage';
import { MeetingDetailPage } from '@/features/meetings/MeetingDetailPage';
import { DecisionsPage } from '@/features/decisions/DecisionsPage';
import { KnowledgePage } from '@/features/knowledge/KnowledgePage';
import { WorkflowsPage } from '@/features/workflows/WorkflowsPage';
import { IntelligencePage } from '@/features/intelligence/IntelligencePage';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { TeamPage } from '@/features/team/TeamPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

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
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/meetings/:meetingId" element={<MeetingDetailPage />} />
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
