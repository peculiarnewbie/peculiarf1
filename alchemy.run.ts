import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import { ScheduleBucket } from "./src/schedule/bucket.ts";

export default Alchemy.Stack(
  "peculiarf1",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const scheduleBucket = yield* ScheduleBucket;

    const site = yield* Cloudflare.StaticSite("peculiarf1", {
      cwd: "frontend",
      command: "npx vite build --config vite.config.ts",
      outdir: "dist",
      main: "./src/worker.ts",
      assetsConfig: {
        notFoundHandling: "single-page-application",
      },
      bindings: {
        SCHEDULE_BUCKET: scheduleBucket,
      },
      url: true,
      domain: "f1.peculiarnewbie.com",
    });

    return {
      scheduleBucketName: scheduleBucket.bucketName,
      url: site.url,
    };
  }),
);
