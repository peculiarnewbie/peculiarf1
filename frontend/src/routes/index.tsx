import { createSignal, Show, createEffect } from "solid-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/solid-query";
import { fetchSchedules, refreshSchedules } from "../lib/api.ts";
import { Header } from "../components/Header.tsx";
import { ScheduleView } from "../components/ScheduleView.tsx";

export function SchedulePage() {
  const queryClient = useQueryClient();
  const [activeSeries, setActiveSeries] = createSignal<string>("f1");
  const [toast, setToast] = createSignal<{ message: string; type: "success" | "error" } | null>(
    null,
  );

  const schedules = useQuery(() => ({
    queryKey: ["schedules"],
    queryFn: fetchSchedules,
    refetchOnMount: true,
    staleTime: 60_000,
  }));

  createEffect(() => {
    if (schedules.data && schedules.data.length > 0) {
      const ids = schedules.data.map((s) => s.series);
      if (!ids.includes(activeSeries()) && ids.length > 0) {
        setActiveSeries(ids[0]);
      }
    }
  });

  const refresh = useMutation(() => ({
    mutationFn: refreshSchedules,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      showToast("Schedules refreshed", "success");
    },
    onError: (err: Error) => {
      showToast(`Refresh failed: ${err.message}`, "error");
    },
  }));

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const currentData = () => {
    return schedules.data?.find((s) => s.series === activeSeries());
  };

  return (
    <div>
      <Show when={schedules.data}>
        {(series) => (
          <Header
            series={series()}
            activeSeries={activeSeries()}
            onSelect={setActiveSeries}
            onRefresh={() => refresh.mutate()}
            refreshing={refresh.isPending}
          />
        )}
      </Show>
      <main id="app">
        <Show
          when={!schedules.isLoading && !schedules.isError}
          fallback={
            <div class="empty-state">
              <Show when={schedules.isLoading}>
                <p>Loading schedules...</p>
              </Show>
              <Show when={schedules.isError}>
                <p>Failed to load schedules.</p>
              </Show>
            </div>
          }
        >
          <Show
            when={currentData()}
            fallback={
              <div class="empty-state">
                <p>No schedule data available. Click Refresh to load.</p>
              </div>
            }
          >
            {(data) => <ScheduleView data={data()} />}
          </Show>
        </Show>
      </main>
      <Show when={toast()}>
        {(t) => (
          <div
            class="toast show"
            classList={{ success: t().type === "success", error: t().type === "error" }}
          >
            {t().message}
          </div>
        )}
      </Show>
    </div>
  );
}
