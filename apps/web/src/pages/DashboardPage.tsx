import { useWorkspace } from '@/features/workspace/useWorkspace';

export default function DashboardPage() {
  const { activeWorkspace } = useWorkspace();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Início</h1>
        <p className="text-sm text-muted-foreground">
          Workspace:{' '}
          <span className="font-medium text-foreground">{activeWorkspace?.name}</span>
        </p>
      </div>

      {/* Placeholder cards — replaced in Phase 1+ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Encomendas', 'Em produção', 'Stock baixo', 'Receita do mês'].map((label) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">—</p>
            <p className="mt-1 text-xs text-muted-foreground">Em breve</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Dashboard completo disponível na Fase 4.
          <br />
          Por agora, o sistema de auth e workspaces está pronto. 🎉
        </p>
      </div>
    </div>
  );
}
