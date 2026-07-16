import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SchedulePage } from './features/schedule/components/SchedulePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SchedulePage />
    </QueryClientProvider>
  );
}
