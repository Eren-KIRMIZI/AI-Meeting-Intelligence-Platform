import { useEffect, useState } from 'react';
import { BrainCircuit, FileText, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Field } from '@/components/common/field';
import { useAnalyzeMeeting } from '@/hooks/use-workspace';
import { analysisSteps } from '@/lib/meeting-intelligence';
import { sampleTranscriptFor } from '@/mocks/transcripts';
import { useI18n } from '@/i18n';
import type { Meeting } from '@/types';

interface AnalyzeMeetingDialogProps {
  meeting: Meeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalyzeMeetingDialog({
  meeting,
  open,
  onOpenChange,
}: AnalyzeMeetingDialogProps) {
  const analyze = useAnalyzeMeeting();
  const { t } = useI18n();
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (open && meeting) {
      setTranscript(sampleTranscriptFor(meeting.id));
    }
  }, [meeting, open]);

  const steps = analysisSteps({
    transcribe: analyze.isPending ? 'running' : 'pending',
    extract: 'pending',
    link: 'pending',
  });

  const submit = () => {
    if (!meeting) return;

    if (transcript.trim().length < 40) {
      toast.error(t('Paste a transcript with at least a few lines.'));
      return;
    }

    analyze.mutate(
      { meetingId: meeting.id, transcript },
      {
        onSuccess: () => {
          toast.success(t('Analysis ready — review the extracted signal.'));
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : t('Could not analyze this meeting.')
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-blue-400" />
            {t('Analyze transcript')}
          </DialogTitle>
          <DialogDescription>
            {meeting
              ? t(
                  'Turn “{{title}}” into a summary, decisions, risks and owned action items.',
                  { title: meeting.title }
                )
              : t('Paste a transcript to extract the meeting signal.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
              <Sparkles className="h-3 w-3 text-blue-400" />
              {t('What runs')}
            </p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.key}
                  className="rounded-md border border-border/60 bg-card/60 px-2.5 py-2"
                >
                  <p className="text-[10px] font-medium text-foreground">
                    {t(step.label)}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                    {t(step.detail)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Field
            label={t('Transcript')}
            htmlFor="meeting-transcript"
            hint={t(
              'Demo mode uses the same deterministic extractor as the sample data, so you can try the full flow without a provider.'
            )}
          >
            <Textarea
              id="meeting-transcript"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              className="min-h-[240px] font-mono text-[11px] leading-relaxed"
              placeholder={t("Ayşe: Let's review the launch plan...")}
              disabled={analyze.isPending}
            />
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => meeting && setTranscript(sampleTranscriptFor(meeting.id))}
              disabled={analyze.isPending}
            >
              <RotateCcw className="h-3 w-3" />
              {t('Reset to sample transcript')}
            </Button>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <FileText className="h-3 w-3" />
              {t('{{count}} words', {
                count: transcript.trim().split(/\s+/).filter(Boolean).length,
              })}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={analyze.isPending}
          >
            {t('Cancel')}
          </Button>
          <Button size="sm" onClick={submit} disabled={analyze.isPending}>
            {analyze.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {analyze.isPending ? t('Analyzing…') : t('Run analysis')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
