export type AccentColor =
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'cyan'
  | 'slate';

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  initials: string;
  avatarColor: string;
  avatarUrl?: string;
  jobTitle?: string;
  workspaceRole?: OrgRole;
}

export interface TeamMember extends UserProfile {
  status: 'active' | 'away' | 'invited';
  workload: number;
  projectIds: string[];
}

export type ProjectStatus =
  | 'planning'
  | 'on_track'
  | 'at_risk'
  | 'off_track'
  | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  category: string;
  color: AccentColor;
  progress: number;
  owner: UserProfile;
  members: UserProfile[];
  taskCount: number;
  completedTasks: number;
  dueDate: string;
  updatedAt: string;
}

export type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  projectName: string;
  assignee: UserProfile | null;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  completedAt?: string | null;
  sourceMeetingId?: string | null;
}

export type MeetingStatus =
  | 'scheduled'
  | 'live'
  | 'processing'
  | 'completed'
  | 'cancelled';

export type MeetingPlatform =
  | 'google_meet'
  | 'microsoft_teams'
  | 'zoom'
  | 'in_person'
  | 'nova_live';

export interface Meeting {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  platform: MeetingPlatform;
  status: MeetingStatus;
  projectId?: string;
  projectName?: string;
  participants: UserProfile[];
  agenda: string[];
  summary?: string;
  actionItems: string[];
  decisions: string[];
  transcriptReady: boolean;
  analysis?: MeetingAnalysis;
  analysisError?: string;
}

export interface TranscriptLine {
  speaker: string;
  at: number;
  text: string;
}

export type AnalysisStepStatus = 'pending' | 'running' | 'done' | 'failed';

export interface AnalysisStep {
  key: 'transcribe' | 'extract' | 'link';
  label: string;
  status: AnalysisStepStatus;
  detail?: string;
}

export interface ExtractedAction {
  id: string;
  text: string;
  owner: string;
  ownerId?: string | null;
  dueDate?: string | null;
  confidence: number;
  taskId?: string | null;
}

export interface ExtractedDecision {
  id: string;
  title: string;
  context: string;
  owner: string;
  ownerId?: string | null;
  confidence: number;
  decisionId?: string | null;
}

export interface MeetingAnalysis {
  summary: string;
  keyPoints: string[];
  risks: string[];
  topics: string[];
  confidence: number;
  transcript: TranscriptLine[];
  actions: ExtractedAction[];
  decisions: ExtractedDecision[];
  analyzedAt: string;
  model: string;
  steps: AnalysisStep[];
}

export interface AnalyzeMeetingInput {
  meetingId: string;
  transcript: string;
}

export interface CommitMeetingInput {
  meetingId: string;
  actionIds: string[];
  decisionIds: string[];
}

export interface CommitMeetingResult {
  tasks: Task[];
  decisions: Decision[];
  knowledge: KnowledgeDocument | null;
}

export type LiveRoomMode = 'video' | 'audio';

export type LiveConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected';

export type LiveTransport = 'mesh' | 'livekit';

export interface LiveParticipant {
  peerId: string;
  userId: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  isSelf: boolean;
  micOn: boolean;
  cameraOn: boolean;
  sharing: boolean;
  joinedAt: string;
  connection: 'connecting' | 'connected' | 'disconnected';
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  speaker: string;
  text: string;
  /** Seconds from the start of the room. */
  at: number;
  createdAt: string;
  source: 'speech' | 'demo';
  /** Recognizer confidence when the browser exposes it. */
  confidence?: number;
}

export interface LiveChatMessage {
  id: string;
  authorId: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface LiveInsights {
  summary: string;
  keyPoints: string[];
  risks: string[];
  topics: string[];
  actions: ExtractedAction[];
  decisions: ExtractedDecision[];
  confidence: number;
}

export interface LiveMeetingInput {
  title: string;
  roomId: string;
  transport: LiveTransport;
  projectId?: string;
  projectName?: string;
  mode: LiveRoomMode;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  participants: LiveParticipant[];
  segments: TranscriptSegment[];
  chat: LiveChatMessage[];
  insights: LiveInsights;
  transcript: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}


export type DecisionStatus = 'proposed' | 'accepted' | 'rejected' | 'superseded';

export interface DecisionStatusEvent {
  id: string;
  status: DecisionStatus;
  note?: string;
  actor: UserProfile;
  createdAt: string;
}

export interface Decision {
  id: string;
  title: string;
  context: string;
  status: DecisionStatus;
  owner: UserProfile;
  meetingTitle: string;
  decidedAt: string;
  impact: 'low' | 'medium' | 'high';
  projectName?: string;
  history: DecisionStatusEvent[];
}

export interface UpdateDecisionInput {
  status: DecisionStatus;
  note?: string;
}

export type ActivityType =
  | 'task'
  | 'comment'
  | 'meeting'
  | 'decision'
  | 'assignment'
  | 'project';

export interface Activity {
  id: string;
  actor: UserProfile;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: string;
}

export type KnowledgeKind =
  | 'meeting_note'
  | 'transcript'
  | 'playbook'
  | 'insight'
  | 'document';

export interface KnowledgeDocument {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  kind: KnowledgeKind;
  tags: string[];
  author: UserProfile;
  sourceMeeting?: string;
  sourceMeetingId?: string;
  updatedAt: string;
  readMinutes: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  triggerLabel: string;
  actionLabels: string[];
  isActive: boolean;
  runCount: number;
  lastRunAt: string | null;
  accent: AccentColor;
}

export type WorkflowRunStatus = 'success' | 'failed' | 'skipped';

export interface WorkflowRunStep {
  label: string;
  status: WorkflowRunStatus;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: WorkflowRunStatus;
  trigger: string;
  summary: string;
  startedAt: string;
  durationMs: number;
  steps: WorkflowRunStep[];
}

export type IntegrationStatus = 'connected' | 'available' | 'error';

export type IntegrationIcon = 'calendar' | 'video' | 'chat' | 'mail' | 'storage';

export interface Integration {
  id: string;
  provider: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  category: string;
  icon: IntegrationIcon;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  type: 'meeting' | 'task' | 'decision' | 'mention';
}

export interface DashboardStat {
  id: string;
  label: string;
  value: number;
  change: string;
  period: string;
  direction: 'up' | 'down' | 'flat';
  tone?: 'positive' | 'negative' | 'neutral';
  trend: number[];
  accent: AccentColor;
}

export interface AiBriefItem {
  text: string;
  owner: string;
  tag: string;
}

export interface AiBrief {
  meetingTitle: string;
  summary: string;
  updatedAt: string;
  items: AiBriefItem[];
}

export interface Insight {
  id: string;
  title: string;
  summary: string;
  meetingTitle: string;
  confidence: number;
  createdAt: string;
  items: string[];
  kind: 'summary' | 'decision' | 'action' | 'risk';
}

export interface SeriesPoint {
  label: string;
  completed: number;
  created: number;
}

export interface WorkloadItem {
  member: TeamMember;
  assigned: number;
  capacity: number;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  status: ProjectStatus;
  category: string;
  dueDate: string;
}

export interface CreateTaskInput {
  title: string;
  projectId: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
}

export interface CreateMeetingInput {
  title: string;
  startsAt: string;
  durationMinutes: number;
  platform: MeetingPlatform;
  agenda: string[];
}

export interface CreateWorkflowInput {
  name: string;
  description: string;
  triggerType: string;
  triggerLabel: string;
  actionLabels: string[];
}

export interface InviteMemberInput {
  email: string;
  role: OrgRole;
}
