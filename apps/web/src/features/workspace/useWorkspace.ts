import { useWorkspaceContext } from './WorkspaceProvider';

/**
 * Convenience hook for consuming workspace context.
 * Throws if used outside <WorkspaceProvider>.
 */
export function useWorkspace() {
  return useWorkspaceContext();
}
