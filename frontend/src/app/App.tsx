import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { BrowserRouter } from 'react-router-dom';
import {
  AppErrorFallback,
  ErrorBoundary,
} from '@/components/common/error-boundary';
import { AppProviders } from './providers/AppProviders';
import { AppRoutes } from './router';

// Vercel injects the analytics endpoints only on deployed hosts. Mounting them
// on localhost would produce 404s during local builds and e2e runs.
const isDeployedHost =
  import.meta.env.PROD &&
  !['localhost', '127.0.0.1'].includes(window.location.hostname);

export function App() {
  return (
    <AppProviders>
      {isDeployedHost && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
      <BrowserRouter>
        <ErrorBoundary fallback={() => <AppErrorFallback />}>
          <AppRoutes />
        </ErrorBoundary>
      </BrowserRouter>
    </AppProviders>
  );
}
