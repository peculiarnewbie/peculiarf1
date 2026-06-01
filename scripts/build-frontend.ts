import { execSync } from "node:child_process";
import { resolve } from "node:path";

const FRONTEND_DIR = resolve(import.meta.dirname, "..", "frontend");

execSync("npx vite build --config vite.config.ts", {
  cwd: FRONTEND_DIR,
  stdio: "inherit",
});
