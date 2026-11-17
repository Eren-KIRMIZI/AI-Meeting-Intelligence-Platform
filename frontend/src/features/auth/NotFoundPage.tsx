import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NovaMark } from '@/components/common/nova-mark';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
          <NovaMark className="h-5 w-5" />
        </div>
        <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">
          This page is not on the map
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The link may be outdated, or the workspace module moved. Head back to
          the overview to keep working.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link to="/overview">
              <ArrowLeft className="h-4 w-4" />
              Back to overview
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/meetings">
              <Compass className="h-4 w-4" />
              Browse meetings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
