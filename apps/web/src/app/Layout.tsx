import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore, useCurrentUser } from '@/stores/auth.store';
import { routes } from './routes';
import { cn } from '@/lib/utils';

export function AppLayout(): JSX.Element {
  const user = useCurrentUser();
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  function logout(): void {
    clear();
    navigate(routes.login, { replace: true });
  }

  if (!user) return <Outlet />;

  const tabs =
    user.role === 'admin'
      ? [
          { to: routes.adminUpload, label: 'Importar planilha' },
          { to: routes.adminReport, label: 'Relatório' },
        ]
      : [
          { to: routes.extract, label: 'Extrato' },
          { to: routes.wallet, label: 'Carteira' },
          { to: routes.account, label: 'Minha conta' },
        ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="text-lg font-semibold">
            Nex Digital
          </Link>
          <nav aria-label="Principal" className="flex flex-1 items-center gap-4">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  cn(
                    'text-sm text-muted-foreground hover:text-foreground',
                    isActive && 'font-medium text-foreground',
                  )
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.name}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}
