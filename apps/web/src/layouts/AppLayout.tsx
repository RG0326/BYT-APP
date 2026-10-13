import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Factory,
  Package,
  MoreHorizontal,
  LogOut,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/features/workspace/useWorkspace';
import { WorkspaceSelector } from '@/features/workspace/WorkspaceSelector';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { to: '/orders', label: 'Encomendas', icon: ShoppingCart },
  { to: '/production', label: 'Produção', icon: Factory },
  { to: '/stock', label: 'Stock', icon: Package },
];

export function AppLayout() {
  const { activeWorkspace } = useWorkspace();
  const location = useLocation();

  const currentNavItem = navItems.find((item) => location.pathname.startsWith(item.to));

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen bg-background">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-border bg-card lg:flex">
        {/* Workspace header */}
        <div className="flex items-center gap-3 border-b border-border p-4">
          {activeWorkspace?.logo_url ? (
            <img
              src={activeWorkspace.logo_url}
              alt={`${activeWorkspace.name} logo`}
              className="h-8 w-8 rounded-md object-cover"
            />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white"
              style={{ backgroundColor: activeWorkspace?.accent_color ?? '#6366f1' }}
            >
              {activeWorkspace?.name.slice(0, 2).toUpperCase() ?? 'BT'}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {activeWorkspace?.name ?? 'BYT 3D'}
            </p>
            <p className="text-xs text-muted-foreground">Workspace</p>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="border-b border-border py-3">
          <p className="px-5 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Workspaces
          </p>
          <WorkspaceSelector />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-secondary font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="border-t border-border p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Terminar sessão
          </button>
        </div>
      </aside>

      {/* ===== Main content area ===== */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-2">
            {/* Workspace accent indicator */}
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: activeWorkspace?.accent_color ?? '#6366f1' }}
            />
            <span className="text-sm font-medium text-foreground">
              {activeWorkspace?.name ?? 'BYT 3D'}
            </span>
          </div>

          {currentNavItem && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm text-muted-foreground">{currentNavItem.label}</span>
            </>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>

        {/* ===== Mobile bottom navigation ===== */}
        <nav className="flex border-t border-border bg-card lg:hidden">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground',
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
          <button
            className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-muted-foreground"
            aria-label="Mais opções"
          >
            <MoreHorizontal className="h-5 w-5" />
            Mais
          </button>
        </nav>
      </div>
    </div>
  );
}
