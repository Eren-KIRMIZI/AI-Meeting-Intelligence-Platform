import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-provider';
import { listProjects, createProject } from '@/services/projects.service';
import {
  createTask,
  listTasks,
  setTaskDone,
} from '@/services/tasks.service';
import {
  createMeeting,
  listMeetings,
} from '@/services/meetings.service';
import { listDecisions } from '@/services/decisions.service';
import { listActivities } from '@/services/activity.service';
import { listKnowledge } from '@/services/knowledge.service';
import {
  createWorkflow,
  listWorkflows,
  setWorkflowActive,
} from '@/services/workflows.service';
import {
  listIntegrations,
  setIntegrationConnected,
} from '@/services/integrations.service';
import { inviteMember, listTeam } from '@/services/team.service';
import {
  listNotifications,
  markAllNotificationsRead,
} from '@/services/notifications.service';
import type {
  CreateMeetingInput,
  CreateProjectInput,
  CreateTaskInput,
  CreateWorkflowInput,
  InviteMemberInput,
  Task,
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

export function useDecisions(options: QueryOptions = {}) {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['decisions', orgId],
    queryFn: () => listDecisions(orgId),
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
