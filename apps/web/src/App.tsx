import { AppProviders } from '@/app/providers';
import { AppRouter } from '@/app/router';

export default function App(): JSX.Element {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
