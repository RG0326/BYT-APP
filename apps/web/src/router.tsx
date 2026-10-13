import { Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { RootLayout } from '@/layouts/RootLayout';
import { AppLayout } from '@/layouts/AppLayout';
import LoginPage from '@/pages/LoginPage';
import WorkspaceSelectPage from '@/pages/WorkspaceSelectPage';
import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { useWorkspace } from '@/features/workspace/useWorkspace';

interface AppRouterProps {
  session: Session | null;
}

export default function AppRouter({ session }: AppRouterProps) {
  const { activeWorkspace } = useWorkspace();

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!activeWorkspace) {
    return (
      <Routes>
        <Route path="/workspaces" element={<WorkspaceSelectPage />} />
        <Route path="*" element={<Navigate to="/workspaces" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Future routes added here per phase */}
        </Route>
        <Route path="/workspaces" element={<WorkspaceSelectPage />} />
      </Route>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
