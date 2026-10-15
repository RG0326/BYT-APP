import { Outlet } from 'react-router-dom';

/**
 * RootLayout — wraps all authenticated routes.
 * Provides workspace context and auth guard.
 * The WorkspaceProvider is nested inside App, but this layout
 * serves as the Outlet wrapper for React Router's route tree.
 */
export function RootLayout() {
  return <Outlet />;
}
