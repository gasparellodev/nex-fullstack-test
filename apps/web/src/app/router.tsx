import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { UploadPage } from '@/features/admin/upload/UploadPage';
import { ReportPage } from '@/features/admin/report/ReportPage';
import { ExtractPage } from '@/features/extract/ExtractPage';
import { WalletPage } from '@/features/wallet/WalletPage';
import { AppLayout } from './Layout';
import { ProtectedRoute } from './ProtectedRoute';
import { homeForRole, routes } from './routes';
import { useAuthStore } from '@/stores/auth.store';

function HomeRedirect(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to={routes.login} replace />;
  return <Navigate to={homeForRole(user.role)} replace />;
}

function Placeholder({ title }: { title: string }): JSX.Element {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">
        Em breve — esta página será entregue em um PR seguinte.
      </p>
    </section>
  );
}

const router = createBrowserRouter([
  { path: routes.login, element: <LoginPage /> },
  { path: routes.register, element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: routes.home, element: <HomeRedirect /> },
          {
            element: <ProtectedRoute roles={['user']} />,
            children: [
              { path: routes.extract, element: <ExtractPage /> },
              { path: routes.wallet, element: <WalletPage /> },
              { path: routes.account, element: <Placeholder title="Minha conta" /> },
            ],
          },
          {
            element: <ProtectedRoute roles={['admin']} />,
            children: [
              { path: routes.adminUpload, element: <UploadPage /> },
              { path: routes.adminReport, element: <ReportPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={routes.home} replace /> },
]);

export function AppRouter(): JSX.Element {
  return <RouterProvider router={router} />;
}
