import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Workspace } from '@byt3d/types';

const STORAGE_KEY = 'byt3d:activeWorkspaceId';

interface WorkspaceContextValue {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  setActiveWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);

  // Restore active workspace from localStorage on mount
  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId && workspaces.length > 0) {
      const found = workspaces.find((w) => w.id === storedId) ?? null;
      setActiveWorkspaceState(found);
    }
  }, [workspaces]);

  // Apply workspace accent color CSS variable to document root
  useEffect(() => {
    const root = document.documentElement;
    if (activeWorkspace?.accent_color) {
      root.style.setProperty('--accent-primary', activeWorkspace.accent_color);
    } else {
      root.style.removeProperty('--accent-primary');
    }
  }, [activeWorkspace]);

  const setActiveWorkspace = (workspace: Workspace | null) => {
    setActiveWorkspaceState(workspace);
    if (workspace) {
      localStorage.setItem(STORAGE_KEY, workspace.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{ activeWorkspace, workspaces, setActiveWorkspace, setWorkspaces }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspaceContext must be used inside <WorkspaceProvider>');
  }
  return ctx;
}
