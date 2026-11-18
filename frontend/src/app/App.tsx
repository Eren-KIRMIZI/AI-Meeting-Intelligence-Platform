import { BrowserRouter } from 'react-router-dom';
import {
  AppErrorFallback,
  ErrorBoundary,
} from '@/components/common/error-boundary';
import { AppProviders } from './providers/AppProviders';
import { AppRoutes } from './router';

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <ErrorBoundary fallback={() => <AppErrorFallback />}>
          <AppRoutes />
        </ErrorBoundary>
      </BrowserRouter>
    </AppProviders>
  );
}
