import { For } from "solid-js";
import type { SeriesSchedule } from "../lib/api.ts";
import { seriesLabel } from "../lib/api.ts";

interface HeaderProps {
  series: SeriesSchedule[];
  activeSeries: string;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function Header(props: HeaderProps) {
  return (
    <header>
      <div class="header-inner">
        <h1>
          <span>Peculiar</span>F1
        </h1>
        <nav class="series-nav">
          <For each={props.series}>
            {(s) => (
              <button
                class="series-btn"
                classList={{ active: s.series === props.activeSeries }}
                onClick={() => props.onSelect(s.series)}
              >
                {seriesLabel(s.series)}
              </button>
            )}
          </For>
        </nav>
        <button
          class="refresh-btn"
          classList={{ loading: props.refreshing }}
          disabled={props.refreshing}
          onClick={props.onRefresh}
        >
          <span class="spinner">{props.refreshing ? "⟳" : ""}</span>
          <span class="label">{props.refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>
    </header>
  );
}
