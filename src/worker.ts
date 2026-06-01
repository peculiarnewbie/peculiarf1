import { Effect } from "effect";
import { refreshAllSchedules, SeriesList } from "./schedule/pipeline.ts";

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  SCHEDULE_BUCKET: R2Bucket;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function handleError(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === "/api/schedules" && request.method === "GET") {
      return handleError(async () => {
        const results: string[] = [];
        for (const series of SeriesList) {
          const obj = await env.SCHEDULE_BUCKET.get(`schedules/${series}.json`);
          if (obj !== null) {
            results.push(await obj.text());
          }
        }
        return new Response("[" + results.join(",") + "]", {
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      });
    }

    if (url.pathname === "/api/refresh" && request.method === "POST") {
      return handleError(async () => {
        const schedules = await Effect.runPromise(refreshAllSchedules());
        for (const s of schedules) {
          await env.SCHEDULE_BUCKET.put(`schedules/${s.series}.json`, JSON.stringify(s));
        }
        return new Response(JSON.stringify({ success: true, count: schedules.length }), {
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      });
    }

    return env.ASSETS.fetch(request);
  },
};
