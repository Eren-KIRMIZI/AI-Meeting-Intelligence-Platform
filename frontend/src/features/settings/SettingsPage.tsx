import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell,
  Building2,
  Check,
  Download,
  KeyRound,
  LogOut,
  Plug,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { Field } from '@/components/common/field';
import { LanguageSwitcher } from '@/components/common/language-switcher';
import { UserAvatar } from '@/components/common/user-avatar';
import { IntegrationIcon } from '@/components/common/integration-icon';
import { IntegrationStatusBadge } from '@/components/common/status-badges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select-native';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/use-auth';
import {
  useDecisions,
  useIntegrations,
  useMeetings,
  useProjects,
  useTasks,
  useTeam,
  useToggleIntegration,
} from '@/hooks/use-workspace';
import { downloadJson } from '@/lib/utils';
import { useI18n } from '@/i18n';
import {
  usePreferencesStore,
  type NotificationPreferenceKey,
} from '@/stores/preferences-store';

const tabs = [
  { value: 'profile', label: 'Profile', icon: UserRound },
  { value: 'workspace', label: 'Workspace', icon: Building2 },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'integrations', label: 'Integrations', icon: Plug },
  { value: 'security', label: 'Security', icon: ShieldCheck },
];

const notificationOptions: Array<{
  key: NotificationPreferenceKey;
  label: string;
  description: string;
}> = [
  {
    key: 'meetingBriefs',
    label: 'Meeting briefs',
    description: 'Notify me when a meeting summary and action items are ready.',
  },
  {
    key: 'actionItems',
    label: 'Action item updates',
    description: 'Tell me when an action item I own is assigned or becomes overdue.',
  },
  {
    key: 'decisionReviews',
    label: 'Decision reviews',
    description: 'Send a reminder when a decision is waiting for my input.',
  },
  {
    key: 'weeklyDigest',
    label: 'Weekly digest',
    description: 'A Friday summary of delivery, decisions and meeting output.',
  },
  {
    key: 'mentions',
    label: 'Mentions and account updates',
    description: 'Notify me when a teammate mentions me or my role and project access change.',
  },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, orgName, orgRole, isDemo, signOut } = useAuth();
  const { t } = useI18n();

  const requestedTab = searchParams.get('tab');
  const activeTab = tabs.some((tab) => tab.value === requestedTab)
    ? (requestedTab as string)
    : 'profile';

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'profile') next.delete('tab');
    else next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  const preferences = usePreferencesStore();
  const [displayName, setDisplayName] = useState(
    user?.fullName ?? preferences.displayName
  );
  const [jobTitle, setJobTitle] = useState(
    user?.jobTitle ?? preferences.jobTitle
  );
  const [timezone, setTimezone] = useState(preferences.timezone);
  const [weekStart, setWeekStart] = useState(preferences.weekStart);

  const integrations = useIntegrations();
  const toggleIntegration = useToggleIntegration();
  const projects = useProjects();
  const tasks = useTasks();
  const meetings = useMeetings();
  const decisions = useDecisions();
  const team = useTeam();

  const integrationList = integrations.data ?? [];

  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = displayName.trim();
    if (name.length < 2) {
      toast.error(t('Enter a display name with at least 2 characters'));
      return;
    }
    preferences.setProfile({ displayName: name, jobTitle: jobTitle.trim() });
    toast.success(t('Profile preferences saved'));
  };

  const saveWorkspace = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    preferences.setWorkspace({ timezone, weekStart });
    toast.success(t('Workspace preferences saved'));
  };

  const handleIntegrationToggle = (
    id: string,
    name: string,
    connect: boolean
  ) => {
    toggleIntegration.mutate(
      { id, connect },
      {
        onSuccess: () => {
          toast.success(
            connect
              ? t('{{name}} connected', { name })
              : t('{{name}} disconnected', { name })
          );
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : t('Could not update the integration')
          );
        },
      }
    );
  };

  const exportWorkspace = () => {
    downloadJson('nova-workspace-export.json', {
      exportedAt: new Date().toISOString(),
      organization: { name: orgName, role: orgRole, mode: isDemo ? 'demo' : 'live' },
      projects: projects.data ?? [],
      tasks: tasks.data ?? [],
      meetings: meetings.data ?? [],
      decisions: decisions.data ?? [],
      team: team.data ?? [],
      integrations: integrationList,
    });
    toast.success(t('Workspace export downloaded'));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNotificationToggle = (
    key: NotificationPreferenceKey,
    label: string
  ) => {
    preferences.toggleNotification(key);
    toast.success(t('{{label}} preference updated', { label }));
  };

  const handleSecurityToggle = (
    key: 'twoFactor' | 'sessionAlerts',
    label: string
  ) => {
    preferences.toggleSecurity(key);
    toast.success(t('{{label}} preference updated', { label }));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('Settings')}
        description={t(
          'Your profile, workspace defaults and the controls that keep work predictable.'
        )}
        badge={
          <Badge variant="outline" className="bg-secondary/30">
            {isDemo ? t('Demo workspace') : t('Live workspace')}
          </Badge>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        orientation="vertical"
        className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]"
      >
        <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 p-1 lg:self-start">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="justify-start px-3 py-2 text-xs"
              >
                <Icon className="h-3.5 w-3.5" />
                {t(tab.label)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="min-w-0">
          <TabsContent value="profile" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t('Profile')}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'How you appear across meetings, projects and the decision log.'
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/20 px-3 py-3">
                    <UserAvatar user={user} size="xl" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {displayName || user?.fullName || t('Workspace member')}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {user?.email ?? t('No email on this account')}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="bg-secondary/30">
                          {orgRole ?? t('Workspace member')}
                        </Badge>
                        {isDemo ? (
                          <Badge variant="neutral">{t('Demo profile')}</Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t('Display name')} htmlFor="settings-name">
                      <Input
                        id="settings-name"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder={t('Your name')}
                      />
                    </Field>
                    <Field label={t('Job title')} htmlFor="settings-title">
                      <Input
                        id="settings-title"
                        value={jobTitle}
                        onChange={(event) => setJobTitle(event.target.value)}
                        placeholder={t('Product Lead')}
                      />
                    </Field>
                  </div>

                  <Field
                    label={t('Work email')}
                    htmlFor="settings-email"
                    hint={t(
                      'Email is managed by your authentication provider and cannot be changed here.'
                    )}
                  >
                    <Input
                      id="settings-email"
                      value={user?.email ?? ''}
                      readOnly
                      className="text-muted-foreground"
                    />
                  </Field>

                  <LanguageSwitcher />

                  <div className="flex justify-end">
                    <Button type="submit" size="sm">
                      <Check className="h-3.5 w-3.5" />
                      {t('Save profile')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workspace" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t('Workspace')}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t('Organization defaults for dates, planning and reporting.')}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/20 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <span className="icon-tile h-9 w-9 border-blue-500/20 bg-blue-500/10 text-blue-400">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {orgName ?? t('Workspace')}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t('Pro plan · {{count}} members', {
                          count: team.data?.length ?? 0,
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={isDemo ? 'outline' : 'success'}>
                    {isDemo ? t('Demo data') : t('Live')}
                  </Badge>
                </div>

                <form onSubmit={saveWorkspace} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label={t('Timezone')} htmlFor="settings-timezone">
                      <NativeSelect
                        id="settings-timezone"
                        value={timezone}
                        onChange={(event) => setTimezone(event.target.value)}
                      >
                        <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Europe/Berlin">Europe/Berlin</option>
                        <option value="America/New_York">America/New York</option>
                        <option value="America/Los_Angeles">America/Los Angeles</option>
                        <option value="Asia/Singapore">Asia/Singapore</option>
                      </NativeSelect>
                    </Field>
                    <Field label={t('Week starts on')} htmlFor="settings-week-start">
                      <NativeSelect
                        id="settings-week-start"
                        value={weekStart}
                        onChange={(event) =>
                          setWeekStart(event.target.value as 'monday' | 'sunday')
                        }
                      >
                        <option value="monday">{t('Monday')}</option>
                        <option value="sunday">{t('Sunday')}</option>
                      </NativeSelect>
                    </Field>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {t('Workspace data')}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {t(
                          'Download a JSON snapshot of projects, tasks, meetings and decisions.'
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={exportWorkspace}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t('Export data')}
                    </Button>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" size="sm">
                      <Check className="h-3.5 w-3.5" />
                      {t('Save workspace')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t('Notifications')}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t('Choose which meeting and delivery signals reach you.')}
                </p>
              </CardHeader>
              <CardContent className="divide-y divide-border/70 p-0">
                {notificationOptions.map((option) => (
                  <div
                    key={option.key}
                    className="flex items-start justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {t(option.label)}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        {t(option.description)}
                      </p>
                    </div>
                    <Switch
                      checked={preferences.notifications[option.key]}
                      onCheckedChange={() =>
                        handleNotificationToggle(option.key, t(option.label))
                      }
                      aria-label={t('Toggle {{label}}', {
                        label: t(option.label),
                      })}
                    />
                  </div>
                ))}
                <p className="px-5 py-3 text-[10px] text-muted-foreground">
                  {t(
                    'These switches filter the notification menu immediately and are stored in this browser. Email delivery is configured when a live workspace is connected.'
                  )}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-0">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
                <div>
                  <CardTitle>{t('Integrations')}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(
                      'Connect the tools where your meetings and follow-ups already live.'
                    )}
                  </p>
                </div>
                <Badge variant="outline" className="bg-secondary/30">
                  {t('{{count}} connected', {
                    count: integrationList.filter(
                      (item) => item.status === 'connected'
                    ).length,
                  })}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {integrationList.length === 0 ? (
                  <p className="px-5 py-10 text-center text-xs text-muted-foreground">
                    {t('No integrations are available yet.')}
                  </p>
                ) : (
                  <div className="divide-y divide-border/70">
                    {integrationList.map((integration) => {
                      const isConnected = integration.status === 'connected';
                      return (
                        <div
                          key={integration.id}
                          className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <IntegrationIcon integration={integration} />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-xs font-medium text-foreground">
                                  {integration.name}
                                </p>
                                <IntegrationStatusBadge
                                  status={integration.status}
                                />
                              </div>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                                {integration.description ||
                                  t('{{category}} integration', {
                                    category: integration.category,
                                  })}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3 pl-12 sm:pl-0">
                            <Badge variant="outline">{integration.category}</Badge>
                            <Switch
                              checked={isConnected}
                              disabled={toggleIntegration.isPending}
                              onCheckedChange={(next) =>
                                handleIntegrationToggle(
                                  integration.id,
                                  integration.name,
                                  next
                                )
                              }
                              aria-label={t(
                                isConnected
                                  ? 'Disconnect {{name}}'
                                  : 'Connect {{name}}',
                                { name: integration.name }
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="px-5 py-3 text-[10px] text-muted-foreground">
                  {t(
                    'Connections are simulated in demo mode and never store provider secrets in the browser.'
                  )}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-0 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t('Access and sessions')}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t('Controls for account protection and workspace data.')}
                </p>
              </CardHeader>
              <CardContent className="divide-y divide-border/70 p-0">
                <div className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="icon-tile h-8 w-8 border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {t('Require two-factor for admins')}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        {t(
                          'Enforce a second factor before an admin can manage members or integrations.'
                        )}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.security.twoFactor}
                    onCheckedChange={() =>
                      handleSecurityToggle(
                        'twoFactor',
                        t('Two-factor requirement')
                      )
                    }
                    aria-label={t('Toggle two-factor requirement')}
                  />
                </div>

                <div className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="icon-tile h-8 w-8 border-blue-500/20 bg-blue-500/10 text-blue-400">
                      <Bell className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {t('Session alerts')}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        {t('Email me when a new device signs in to this workspace.')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.security.sessionAlerts}
                    onCheckedChange={() =>
                      handleSecurityToggle('sessionAlerts', t('Session alerts'))
                    }
                    aria-label={t('Toggle session alerts')}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {t('Download workspace data')}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t('A portable snapshot of the records you can already see.')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportWorkspace}
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t('Download')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>{t('Current session')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5">
                  <p className="text-xs font-medium text-foreground">
                    {t('This browser')}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {user?.email ?? t('Signed in')} ·{' '}
                    {isDemo ? t('Demo session') : t('Supabase session')}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-[10px] leading-relaxed text-amber-200/80">
                  {t(
                    'Security toggles are stored locally in this build. They are ready to be wired to server-side policy enforcement before production use.'
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground">
                    {t('Signing out clears this browser session.')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleSignOut()}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t('Sign out')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
