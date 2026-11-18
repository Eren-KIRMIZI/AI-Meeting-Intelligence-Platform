import { useState } from 'react';
import {
  ListChecks,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  useFollowUpMessages,
  useGenerateFollowUpMessages,
  useSetFollowUpStatus,
} from '@/hooks/use-workspace';
import { followUpCompletion, nextFollowUpStatus } from '@/lib/follow-up';
import { formatRelativeTime } from '@/lib/utils';
import { useI18n } from '@/i18n';
import type { FollowUpChannel, FollowUpStatus, Meeting } from '@/types';

const channelMeta: Record<
  FollowUpChannel,
  { label: string; icon: typeof Mail }
> = {
  email: { label: 'Email', icon: Mail },
  chat: { label: 'Chat', icon: MessageSquare },
  task: { label: 'Tasks', icon: ListChecks },
};

const statusMeta: Record<
  FollowUpStatus,
  { label: string; variant: 'neutral' | 'info' | 'success' }
> = {
  draft: { label: 'Draft', variant: 'neutral' },
  queued: { label: 'Queued', variant: 'info' },
  sent: { label: 'Sent', variant: 'success' },
};

/**
 * The follow-up pack after the meeting: a recap email, an owner nudge and the
 * task digest. Every step is explicit, so nothing leaves the workspace by
 * accident.
 */
export function MeetingFollowUpCard({ meeting }: { meeting: Meeting }) {
  const { t } = useI18n();
  const messagesQuery = useFollowUpMessages(meeting.id);
  const generate = useGenerateFollowUpMessages();
  const update = useSetFollowUpStatus();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const messages = messagesQuery.data ?? [];
  const completion = followUpCompletion(messages);

  const generatePack = () => {
    generate.mutate(meeting.id, {
      onSuccess: () => toast.success(t('Follow-up pack generated')),
      onError: () => toast.error(t('Could not generate the follow-up pack')),
    });
  };

  const advance = (messageId: string, status: FollowUpStatus) => {
    const next = nextFollowUpStatus(status);
    setPendingId(messageId);
    update.mutate(
      { messageId, status: next },
      {
        onSuccess: () =>
          toast.success(
            next === 'sent' ? t('Follow-up sent') : t('Follow-up queued')
          ),
        onError: () => toast.error(t('Could not update the follow-up')),
        onSettled: () => setPendingId(null),
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Send className="h-3.5 w-3.5 text-emerald-400" />
          {t('AI follow-up')}
        </CardTitle>
        {messages.length > 0 ? (
          <Badge variant={completion === 100 ? 'success' : 'outline'}>
            {t('{{count}}% sent', { count: completion })}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {messagesQuery.isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('Loading follow-ups…')}
          </div>
        ) : messages.length === 0 ? (
          <>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {t(
                'Turn the analysis into a recap email, an owner nudge and a task digest.'
              )}
            </p>
            <Button
              className="w-full"
              size="sm"
              onClick={generatePack}
              disabled={generate.isPending}
            >
              {generate.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {generate.isPending
                ? t('Generating…')
                : t('Generate follow-up')}
            </Button>
          </>
        ) : (
          <>
            <Progress
              value={completion}
              aria-label={t('Follow-up completion')}
            />

            <div className="space-y-2">
              {messages.map((message) => {
                const channel = channelMeta[message.channel];
                const status = statusMeta[message.status];
                const ChannelIcon = channel.icon;
                const isPending = pendingId === message.id && update.isPending;

                return (
                  <div
                    key={message.id}
                    className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="bg-secondary/30">
                        <ChannelIcon className="h-3 w-3" />
                        {t(channel.label)}
                      </Badge>
                      <Badge variant={status.variant}>
                        {t(status.label)}
                      </Badge>
                      <span className="ml-auto truncate text-[10px] text-muted-foreground">
                        {message.recipient}
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] font-medium leading-snug text-foreground">
                      {message.subject}
                    </p>
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-[10px] leading-relaxed text-muted-foreground">
                      {message.body}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {message.status === 'sent' && message.sentAt
                          ? t('Sent {{time}}', {
                              time: formatRelativeTime(message.sentAt),
                            })
                          : formatRelativeTime(message.createdAt)}
                      </span>
                      {message.status !== 'sent' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-[10px]"
                          onClick={() => advance(message.id, message.status)}
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          {message.status === 'draft'
                            ? t('Queue')
                            : t('Send')}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[11px]"
              onClick={generatePack}
              disabled={generate.isPending}
            >
              {generate.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {t('Regenerate follow-up')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
