import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const configuredPath = process.env.CORE_E2E_ENV_PATH;
const defaultPath = resolve(root, "..", "cxapp", ".env");
const envPath = configuredPath ? resolve(configuredPath) : defaultPath;
const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, "utf8")) : {};
const child = spawn(process.execPath, ["dist/api/testing/core-stack.e2e.js"], {
  cwd: root,
  env: { ...process.env, ...fileEnv, CODEXSUN_ALLOW_MISSING_ENV: "1" },
  stdio: "inherit",
  windowsHide: true
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        let value = line.slice(index + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        )
          value = value.slice(1, -1);
        return [key, value];
      })
  );
}
