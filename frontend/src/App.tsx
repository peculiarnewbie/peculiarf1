import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { Router, Route } from "@solidjs/router";
import { SchedulePage } from "./routes/index.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Route path="/" component={SchedulePage} />
      </Router>
    </QueryClientProvider>
  );
}
