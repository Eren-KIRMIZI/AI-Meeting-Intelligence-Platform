import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/common/field';
import { NovaMark } from '@/components/common/nova-mark';
import { useAuth } from '@/features/auth/use-auth';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { useI18n } from '@/i18n';

const highlights = [
  'Every meeting becomes a brief with owners and next steps.',
  'Decisions stay in one log instead of scattered across calls.',
  'Delivery, capacity and meeting output share one workspace.',
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isDemo, signIn, enterDemo } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useDocumentTitle('Sign in');

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? '/overview';

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleDemo = () => {
    enterDemo();
    navigate(redirectTo, { replace: true });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(t('Enter your email and password to continue.'));
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : t('Sign in failed. Check your credentials and try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border/70 bg-[#0C0E11] p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
              <NovaMark className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold tracking-tight">
                Nova
              </p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {t('Meeting intelligence')}
              </p>
            </div>
          </div>

          <div className="mt-20 max-w-lg">
            <Badge variant="outline" className="bg-secondary/30">
              <Sparkles className="h-3 w-3" />
              {t('Meeting-to-execution workspace')}
            </Badge>
            <h1 className="mt-5 font-display text-[38px] font-semibold leading-[1.12] tracking-[-0.045em] text-foreground">
              {t('Turn every conversation into work that actually moves.')}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              {t(
                'Nova connects meeting briefs, decisions, projects and the people who own them — so the signal survives the call.'
              )}
            </p>

            <ul className="mt-8 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {t(item)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{t('Nova Labs · Workspace intelligence')}</span>
          <span>{t('Private by design')}</span>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
              <NovaMark className="h-4 w-4" />
            </span>
            <span className="font-display text-sm font-semibold">Nova</span>
          </div>
          <Badge variant="outline" className="bg-secondary/30">
            {isDemo ? t('Demo') : t('Live')}
          </Badge>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-sm">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {isDemo ? t('Demo workspace') : t('Welcome back')}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {isDemo ? t('Step into Nova') : t('Sign in to Nova')}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {isDemo
                ? t(
                    'Explore the full workspace with a prepared demo team, projects and meeting history.'
                  )
                : t(
                    'Use your workspace credentials to open the meeting intelligence hub.'
                  )}
            </p>

            {isDemo ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-border/70 bg-card p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10 text-blue-400">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        Nova Labs
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t('Pro plan · 7 members · 5 projects')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                    <div>
                      <p className="font-display text-base font-semibold leading-none tabular">
                        8
                      </p>
                      <p className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">
                        {t('Meetings')}
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-base font-semibold leading-none tabular">
                        17
                      </p>
                      <p className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">
                        {t('My Tasks')}
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-base font-semibold leading-none tabular">
                        6
                      </p>
                      <p className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">
                        {t('Decisions')}
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={handleDemo}>
                  {t('Enter demo workspace')}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5">
                  <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    {t(
                      'No credentials are required. Demo records live in this browser and reset when you reload the app.'
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Field label={t('Work email')} htmlFor="login-email">
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </Field>
                <Field label={t('Password')} htmlFor="login-password">
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </Field>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[11px] leading-relaxed text-rose-300"
                  >
                    {error}
                  </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {t('Sign in')}
                  {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>

                <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
                  {t(
                    'Access is managed by your organization. Ask a workspace admin if you need an invitation.'
                  )}
                </p>
              </form>
            )}

            <div className="mt-8 border-t border-border/60 pt-4">
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                {isDemo
                  ? t(
                      'Connect Supabase credentials to enable live email sign-in and shared workspace data.'
                    )
                  : t(
                      'Sessions are protected by Supabase Auth. Workspace data is isolated with row-level security.'
                    )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
