import { useWorkspace } from './useWorkspace';
import type { Workspace } from '@byt3d/types';

interface WorkspaceSelectorProps {
  onSelect?: (workspace: Workspace) => void;
}

export function WorkspaceSelector({ onSelect }: WorkspaceSelectorProps) {
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();

  const handleSelect = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    onSelect?.(workspace);
  };

  if (workspaces.length === 0) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        Sem workspaces
      </div>
    );
  }

  return (
    <div className="space-y-1 px-2">
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          onClick={() => handleSelect(workspace)}
          className={[
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
            activeWorkspace?.id === workspace.id
              ? 'bg-secondary text-secondary-foreground font-medium'
              : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
          ].join(' ')}
        >
          {/* Workspace color indicator */}
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: workspace.accent_color ?? '#6366f1' }}
          />
          <span className="truncate">{workspace.name}</span>
        </button>
      ))}
    </div>
  );
}
