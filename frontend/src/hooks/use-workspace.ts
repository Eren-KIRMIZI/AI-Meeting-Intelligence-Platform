import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/use-auth';
import { listProjects, createProject } from '@/services/projects.service';
import {
  createTask,
  listTasks,
  setTaskDone,
  updateTask,
} from '@/services/tasks.service';
import {
  analyzeMeeting,
  commitMeetingAnalysis,
  createMeeting,
  getMeeting,
  listMeetings,
  saveLiveMeeting,
} from '@/services/meetings.service';
import { listDecisions, updateDecisionStatus } from '@/services/decisions.service';
import {
  convertInsightToDecision,
  convertInsightToTask,
  listInsights,
  setInsightStatus,
} from '@/services/intelligence.service';
import { saveMeetingRecording } from '@/services/recordings.service';
import { listActivities } from '@/services/activity.service';
import { listKnowledge } from '@/services/knowledge.service';
import {
  createWorkflow,
  listWorkflowRuns,
  listWorkflows,
  setWorkflowActive,
} from '@/services/workflows.service';
import {
  listIntegrations,
  setIntegrationConnected,
} from '@/services/integrations.service';
import {
  inviteMember,
  listTeam,
  removeMember,
  setMemberProjects,
  updateMemberRole,
} from '@/services/team.service';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications.service';
import type {
  AnalyzeMeetingInput,
  CommitMeetingInput,
  ConvertInsightToDecisionInput,
  ConvertInsightToTaskInput,
  CreateMeetingInput,
  CreateProjectInput,
  CreateTaskInput,
  CreateWorkflowInput,
  InviteMemberInput,
  LiveMeetingInput,
  SaveMeetingRecordingInput,
  SetInsightStatusInput,
  SetMemberProjectsInput,
  Task,
  UpdateDecisionInput,
  UpdateMemberRoleInput,
  UpdateTaskInput,
} from '@/types';

interface QueryOptions {
  enabled?: boolean;
}

export function useProjects(options: QueryOptions = {}) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['projects', orgId],
    queryFn: () => listProjects(orgId),
    enabled: options.enabled ?? true,
  });
}

export function useTasks(options: QueryOptions = {}) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['tasks', orgId],
    queryFn: () => listTasks(orgId),
    enabled: options.enabled ?? true,
  });
}

export function useMeetings(options: QueryOptions = {}) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['meetings', orgId],
    queryFn: () => listMeetings(orgId),
    enabled: options.enabled ?? true,
  });
}

export function useMeeting(meetingId: string | undefined) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['meeting', orgId, meetingId],
    queryFn: () => getMeeting(meetingId as string, orgId),
    enabled: Boolean(meetingId),
  });
}

export function useDecisions(options: QueryOptions = {}) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['decisions', orgId],
    queryFn: () => listDecisions(orgId),
    enabled: options.enabled ?? true,
  });
}

export function useInsights(options: QueryOptions = {}) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['insights', orgId],
    queryFn: () => listInsights(orgId),
    enabled: options.enabled ?? true,
  });
}

export function useActivities(options: QueryOptions = {}) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['activities', orgId],
    queryFn: () => listActivities(orgId),
    enabled: options.enabled ?? true,
  });
}

export function useKnowledge(options: QueryOptions = {}) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['knowledge', orgId],
    queryFn: () => listKnowledge(orgId),
    enabled: options.enabled ?? true,
  });
}

export function useWorkflows(options: QueryOptions = {}) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['workflows', orgId],
    queryFn: () => listWorkflows(orgId),
    enabled: options.enabled ?? true,
  });
}

export function useWorkflowRuns(
  workflowId: string | null,
  options: QueryOptions = {}
) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['workflow-runs', workflowId, orgId],
    queryFn: () => listWorkflowRuns(workflowId as string, orgId),
    enabled: (options.enabled ?? true) && Boolean(workflowId),
  });
}

export function useIntegrations(options: QueryOptions = {}) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['integrations', orgId],
    queryFn: () => listIntegrations(orgId),
    enabled: options.enabled ?? true,
  });
}

export function useTeam(options: QueryOptions = {}) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['team', orgId],
    queryFn: () => listTeam(orgId),
    enabled: options.enabled ?? true,
  });
}

export function useNotifications(options: QueryOptions = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => listNotifications(user?.id ?? null),
    enabled: Boolean(user) && (options.enabled ?? true),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { orgId, user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => {
      if (!user) throw new Error('A signed-in user is required.');
      return createProject(input, { orgId, user });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { orgId, user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => {
      if (!user) throw new Error('A signed-in user is required.');
      return createTask(input, { orgId, user });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  const { orgId } = useAuth();
  const key = ['tasks', orgId] as const;

  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      setTaskDone(id, done, orgId),
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);

      queryClient.setQueryData<Task[]>(key, (current) =>
        current?.map((task) =>
          task.id === id
            ? {
                ...task,
                status: done ? 'done' : 'todo',
                completedAt: done ? new Date().toISOString() : null,
              }
            : task
        )
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { orgId } = useAuth();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      updateTask(id, input, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useUpdateDecision() {
  const queryClient = useQueryClient();
  const { orgId, user } = useAuth();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDecisionInput }) => {
      if (!user) throw new Error('A signed-in user is required.');
      return updateDecisionStatus(id, input, { orgId, user });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['decisions'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  const { orgId, user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateMeetingInput) => {
      if (!user) throw new Error('A signed-in user is required.');
      return createMeeting(input, { orgId, user });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meetings'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useSaveLiveMeeting() {
  const queryClient = useQueryClient();
  const { orgId, user, session } = useAuth();

  return useMutation({
    mutationFn: (input: LiveMeetingInput) => {
      if (!user) throw new Error('A signed-in user is required.');
      return saveLiveMeeting(input, {
        orgId,
        user,
        accessToken: session?.access_token ?? null,
      });
    },
    onSuccess: (meeting) => {
      void queryClient.invalidateQueries({ queryKey: ['meetings'] });
      void queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.setQueryData(['meeting', orgId, meeting.id], meeting);
    },
  });
}

export function useSaveMeetingRecording() {
  const queryClient = useQueryClient();
  const { orgId, user } = useAuth();

  return useMutation({
    mutationFn: (input: {
      meetingId: string;
      recording: SaveMeetingRecordingInput;
    }) => {
      if (!user) throw new Error('A signed-in user is required.');
      return saveMeetingRecording(input.meetingId, input.recording, {
        orgId,
        user,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meeting'] });
      void queryClient.invalidateQueries({ queryKey: ['meetings'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useAnalyzeMeeting() {
  const queryClient = useQueryClient();
  const { orgId, user, session } = useAuth();

  return useMutation({
    mutationFn: (input: AnalyzeMeetingInput) => {
      if (!user) throw new Error('A signed-in user is required.');
      return analyzeMeeting(input, {
        orgId,
        user,
        accessToken: session?.access_token ?? null,
      });
    },
    onSuccess: (meeting) => {
      void queryClient.invalidateQueries({ queryKey: ['meeting'] });
      void queryClient.invalidateQueries({ queryKey: ['meetings'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.setQueryData(['meeting', orgId, meeting.id], meeting);
    },
  });
}

export function useCommitMeetingAnalysis() {
  const queryClient = useQueryClient();
  const { orgId, user, session } = useAuth();

  return useMutation({
    mutationFn: (input: CommitMeetingInput) => {
      if (!user) throw new Error('A signed-in user is required.');
      return commitMeetingAnalysis(input, {
        orgId,
        user,
        accessToken: session?.access_token ?? null,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meeting'] });
      void queryClient.invalidateQueries({ queryKey: ['meetings'] });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['decisions'] });
      void queryClient.invalidateQueries({ queryKey: ['knowledge'] });
      void queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const { orgId, user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateWorkflowInput) => {
      if (!user) throw new Error('A signed-in user is required.');
      return createWorkflow(input, { orgId, user });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useToggleWorkflow() {
  const queryClient = useQueryClient();
  const { orgId } = useAuth();

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setWorkflowActive(id, active, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useToggleIntegration() {
  const queryClient = useQueryClient();
  const { orgId } = useAuth();

  return useMutation({
    mutationFn: ({ id, connect }: { id: string; connect: boolean }) =>
      setIntegrationConnected(id, connect, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const { orgId, user, session } = useAuth();

  return useMutation({
    mutationFn: (input: InviteMemberInput) => {
      if (!user) throw new Error('A signed-in user is required.');
      return inviteMember(input, {
        orgId,
        user,
        accessToken: session?.access_token ?? null,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const { orgId, user } = useAuth();

  return useMutation({
    mutationFn: ({ memberId, role }: UpdateMemberRoleInput) => {
      if (!user) throw new Error('A signed-in user is required.');
      return updateMemberRole(memberId, role, { orgId, user });
    },
    onSuccess: () => {
      for (const key of ['team', 'activities', 'notifications']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { orgId, user } = useAuth();

  return useMutation({
    mutationFn: (memberId: string) => {
      if (!user) throw new Error('A signed-in user is required.');
      return removeMember(memberId, { orgId, user });
    },
    onSuccess: () => {
      for (const key of ['team', 'projects', 'activities']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useSetMemberProjects() {
  const queryClient = useQueryClient();
  const { orgId, user } = useAuth();

  return useMutation({
    mutationFn: ({ memberId, projectIds }: SetMemberProjectsInput) => {
      if (!user) throw new Error('A signed-in user is required.');
      return setMemberProjects(memberId, projectIds, { orgId, user });
    },
    onSuccess: () => {
      for (const key of ['team', 'projects', 'activities']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useSetInsightStatus() {
  const queryClient = useQueryClient();
  const { orgId, user } = useAuth();

  return useMutation({
    mutationFn: ({
      insightId,
      input,
    }: {
      insightId: string;
      input: SetInsightStatusInput;
    }) => {
      if (!user) throw new Error('A signed-in user is required.');
      return setInsightStatus(insightId, input, { orgId, user });
    },
    onSuccess: () => {
      for (const key of ['insights', 'activities', 'notifications']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useConvertInsightToTask() {
  const queryClient = useQueryClient();
  const { orgId, user } = useAuth();

  return useMutation({
    mutationFn: ({
      insightId,
      input,
    }: {
      insightId: string;
      input: ConvertInsightToTaskInput;
    }) => {
      if (!user) throw new Error('A signed-in user is required.');
      return convertInsightToTask(insightId, input, { orgId, user });
    },
    onSuccess: () => {
      for (const key of [
        'insights',
        'tasks',
        'projects',
        'activities',
        'notifications',
      ]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useConvertInsightToDecision() {
  const queryClient = useQueryClient();
  const { orgId, user } = useAuth();

  return useMutation({
    mutationFn: ({
      insightId,
      input,
    }: {
      insightId: string;
      input: ConvertInsightToDecisionInput;
    }) => {
      if (!user) throw new Error('A signed-in user is required.');
      return convertInsightToDecision(insightId, input, { orgId, user });
    },
    onSuccess: () => {
      for (const key of [
        'insights',
        'decisions',
        'activities',
        'notifications',
      ]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  const { user, orgId } = useAuth();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(user?.id ?? null, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user, orgId } = useAuth();

  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(notificationId, user?.id ?? null, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
