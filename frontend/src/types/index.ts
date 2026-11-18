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
  joinedAt?: string;
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
  /** Minutes before the start that Nova should remind participants. */
  reminderMinutes?: number[];
  summary?: string;
  actionItems: string[];
  decisions: string[];
  transcriptReady: boolean;
  analysis?: MeetingAnalysis;
  analysisError?: string;
  recordings?: MeetingRecording[];
}

/**
 * Where a recording lives. `local` means the file never left the browser (demo
 * mode); `workspace` means it was uploaded to private workspace storage.
 */
export type RecordingStorage = 'local' | 'workspace';

export interface MeetingRecording {
  id: string;
  meetingId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number;
  storage: RecordingStorage;
  /** Playable URL: an object URL in demo mode, a signed URL in live mode. */
  url?: string;
  createdAt: string;
  uploadedBy: UserProfile;
}

export interface SaveMeetingRecordingInput {
  blob: Blob;
  filename: string;
  mimeType: string;
  durationSeconds: number;
  /** Browser-local URL, used only when the demo store cannot mint its own. */
  localUrl?: string;
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
  | 'project'
  | 'insight';

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

export type IntegrationSyncDirection = 'inbound' | 'outbound' | 'two_way';

export type IntegrationHealth = 'healthy' | 'attention' | 'offline';

export interface Integration {
  id: string;
  provider: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  category: string;
  icon: IntegrationIcon;
  syncDirection: IntegrationSyncDirection;
  lastSyncedAt: string | null;
  nextSyncAt: string | null;
  syncedItems: number;
  accountLabel?: string;
  health: IntegrationHealth;
}

export type IntegrationSyncStatus = 'success' | 'partial' | 'failed';

export interface IntegrationSyncEvent {
  id: string;
  integrationId: string;
  provider: string;
  direction: IntegrationSyncDirection;
  status: IntegrationSyncStatus;
  itemCount: number;
  startedAt: string;
  durationMs: number;
  summary: string;
}

/** A normalised, searchable record built from workspace data. */
export type SearchResultKind =
  | 'meeting'
  | 'transcript'
  | 'decision'
  | 'task'
  | 'person'
  | 'project'
  | 'knowledge';

export interface SearchResult {
  id: string;
  kind: SearchResultKind;
  title: string;
  excerpt: string;
  /** Full searchable text used for ranking and snippet extraction. */
  content: string;
  /** In-app deep link to the record that produced this result. */
  path: string;
  projectId?: string;
  projectName?: string;
  participantIds: string[];
  date: string;
  /** Relevance score computed against the active query. */
  score: number;
  meta?: string;
}

export interface SearchFilters {
  query: string;
  kinds: SearchResultKind[];
  personId: string | null;
  projectId: string | null;
  from: string | null;
  to: string | null;
}

export interface SearchIndexInput {
  meetings: Meeting[];
  tasks: Task[];
  decisions: Decision[];
  knowledge: KnowledgeDocument[];
  projects: Project[];
  team: TeamMember[];
}

export type CalendarEventKind = 'meeting' | 'external' | 'focus';

export type CalendarEventSource = 'nova' | 'google_calendar' | 'microsoft_outlook';

export interface CalendarEvent {
  id: string;
  meetingId?: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  kind: CalendarEventKind;
  platform?: MeetingPlatform;
  projectId?: string;
  projectName?: string;
  participantIds: string[];
  location?: string;
  source: CalendarEventSource;
  reminderMinutes: number[];
  status: 'confirmed' | 'tentative' | 'cancelled';
}

export interface CalendarConflict {
  eventId: string;
  withEventId: string;
  startsAt: string;
  overlapMinutes: number;
  severity: 'full' | 'partial';
}

export type ReminderStatus = 'pending' | 'sent' | 'dismissed';

export interface ScheduleReminder {
  eventId: string;
  meetingId?: string;
  title: string;
  remindAt: string;
  minutesBefore: number;
  status: ReminderStatus;
}

export type NotificationType =
  | 'meeting'
  | 'task'
  | 'decision'
  | 'mention'
  | 'digest';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  type: NotificationType;
  /** In-app deep link. Only same-origin paths are accepted by the UI. */
  link?: string;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: number;
  change: string;
  /** Values interpolated into the translated `change` string. */
  changeVars?: Record<string, string | number>;
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

export type InsightKind = 'summary' | 'decision' | 'action' | 'risk';

export type InsightStatus = 'open' | 'accepted' | 'dismissed' | 'converted';

export interface Insight {
  id: string;
  kind: InsightKind;
  status: InsightStatus;
  title: string;
  summary: string;
  meetingId: string | null;
  meetingTitle: string;
  projectId?: string | null;
  projectName?: string;
  owner: UserProfile;
  dueDate?: string | null;
  confidence: number;
  sourceExcerpt?: string;
  items: string[];
  taskId?: string | null;
  decisionId?: string | null;
  generated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SetInsightStatusInput {
  status: Exclude<InsightStatus, 'converted'>;
  note?: string;
}

export interface ConvertInsightToTaskInput {
  projectId?: string | null;
  priority: TaskPriority;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export interface ConvertInsightToDecisionInput {
  impact: 'low' | 'medium' | 'high';
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
  participantIds?: string[];
  reminderMinutes?: number[];
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

export interface UpdateMemberRoleInput {
  memberId: string;
  role: OrgRole;
}

export interface SetMemberProjectsInput {
  memberId: string;
  projectIds: string[];
}

export type TemplateCategory =
  | 'one_on_one'
  | 'standup'
  | 'retrospective'
  | 'planning'
  | 'sales'
  | 'interview'
  | 'customer'
  | 'custom';

export interface MeetingTemplatePhase {
  id: string;
  title: string;
  durationMinutes: number;
  prompts: string[];
}

export interface MeetingTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  accent: AccentColor;
  durationMinutes: number;
  phases: MeetingTemplatePhase[];
  tags: string[];
  usageCount: number;
  isFavorite: boolean;
  lastUsedAt: string | null;
  owner: UserProfile;
  updatedAt: string;
}

export interface CreateMeetingTemplateInput {
  name: string;
  description: string;
  category: TemplateCategory;
  durationMinutes: number;
  phases: Array<{
    title: string;
    durationMinutes: number;
    prompts: string[];
  }>;
  tags: string[];
}

export type AuditCategory =
  | 'access'
  | 'data'
  | 'integration'
  | 'security'
  | 'compliance';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface AuditEvent {
  id: string;
  category: AuditCategory;
  severity: AuditSeverity;
  action: string;
  actor: UserProfile;
  target: string;
  occurredAt: string;
  ipAddress?: string;
  metadata?: string;
}

export interface AuditFilters {
  query: string;
  category: AuditCategory | 'all';
  severity: AuditSeverity | 'all';
  /** Only include events newer than this many days. `null` keeps everything. */
  days: number | null;
}

export type ComplianceFramework = 'gdpr' | 'soc2' | 'iso27001' | 'hipaa';

export type ComplianceStatus = 'passing' | 'attention' | 'failing';

export interface ComplianceControl {
  id: string;
  framework: ComplianceFramework;
  code: string;
  title: string;
  description: string;
  status: ComplianceStatus;
  owner: UserProfile;
  lastCheckedAt: string;
  evidenceCount: number;
  remediation?: string;
}
