import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/features/workspace/useWorkspace';
import type { Workspace } from '@byt3d/types';

async function fetchUserWorkspaces(): Promise<Workspace[]> {
  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner (
        role,
        active
      )
    `)
    .eq('workspace_members.active', true)
    .order('name');

  if (error) throw error;
  return (data ?? []) as Workspace[];
}

export default function WorkspaceSelectPage() {
  const navigate = useNavigate();
  const { setActiveWorkspace, setWorkspaces } = useWorkspace();

  const { data: workspaces = [], isLoading, error } = useQuery({
    queryKey: ['user-workspaces'],
    queryFn: fetchUserWorkspaces,
  });

  useEffect(() => {
    if (workspaces.length > 0) {
      setWorkspaces(workspaces);
    }
  }, [workspaces, setWorkspaces]);

  const handleSelect = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Seleciona o teu workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tens acesso a {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}.
          </p>
        </div>

        <div className="space-y-3">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              Erro ao carregar workspaces. Tenta novamente.
            </div>
          )}

          {!isLoading && workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => handleSelect(workspace)}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/20 hover:bg-secondary/50"
            >
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: workspace.accent_color ?? '#6366f1' }}
              >
                {workspace.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{workspace.name}</p>
                <p className="text-sm text-muted-foreground">
                  {workspace.iva_regime === 'isento_art53' ? 'Isento Art.53' : 'Regime Normal'} ·{' '}
                  {workspace.currency}
                </p>
              </div>
            </button>
          ))}

          {!isLoading && workspaces.length === 0 && !error && (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não tens acesso a nenhum workspace.
                <br />
                Pede um convite ao proprietário.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
