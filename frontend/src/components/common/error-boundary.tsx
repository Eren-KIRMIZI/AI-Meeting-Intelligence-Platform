import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, RotateCcw, TriangleAlert } from 'lucide-react';
import { NovaMark } from '@/components/common/nova-mark';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { isChunkLoadError } from '@/lib/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: (state: { error: Error; reset: () => void }) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render errors below it so a single broken view cannot take the whole
 * workspace down. Navigation stays usable because the shell lives outside the
 * boundary.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[nova] Unhandled UI error', error, info.componentStack);
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      return this.props.fallback({ error, reset: this.reset });
    }

    return this.props.children;
  }
}

interface RouteErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export function RouteErrorFallback({ error, reset }: RouteErrorFallbackProps) {
  const { t } = useI18n();
  const chunkFailed = isChunkLoadError(error);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-14 text-center"
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-400">
        <TriangleAlert className="h-4 w-4" />
      </span>
      <h2 className="mt-3 text-sm font-semibold text-foreground">
        {chunkFailed
          ? t('This page could not be downloaded')
          : t('This page hit a snag')}
      </h2>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {chunkFailed
          ? t(
              'A part of the workspace did not arrive. Your data is safe — reload to fetch the latest version of this page.'
            )
          : t(
              'Something unexpected interrupted this view. The rest of the workspace is still available, so you can retry or head back to the overview.'
            )}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {chunkFailed ? (
          <Button size="sm" onClick={() => window.location.reload()}>
            <RotateCcw className="h-3.5 w-3.5" />
            {t('Reload page')}
          </Button>
        ) : (
          <Button size="sm" onClick={reset}>
            <RefreshCw className="h-3.5 w-3.5" />
            {t('Try again')}
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <Link to="/overview">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('Back to overview')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function AppErrorFallback() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-5 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
        <NovaMark className="h-5 w-5" />
      </div>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">
        {t('Nova needs a moment')}
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {t(
          'The workspace could not render this view. Your meetings, tasks and decisions are safe — reload to reconnect.'
        )}
      </p>
      <Button className="mt-2" onClick={() => window.location.reload()}>
        <RotateCcw className="h-4 w-4" />
        {t('Reload Nova')}
      </Button>
    </div>
  );
}
