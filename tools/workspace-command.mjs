#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const [command] = process.argv.slice(2);
const supported = new Set(["build", "lint", "typecheck"]);

if (!command || !supported.has(command)) {
  console.error("Usage: node tools/workspace-command.mjs <build|lint|typecheck>");
  process.exit(64);
}

const environment = { ...process.env };
for (const key of Object.keys(environment)) {
  if (key.toLowerCase().replaceAll("-", "_") === "npm_config_global_ignore_file") {
    delete environment[key];
  }
}

const executable = process.env.npm_execpath ? process.execPath : "npm";
const args = process.env.npm_execpath
  ? [process.env.npm_execpath, "run", command, "--workspaces", "--if-present"]
  : ["run", command, "--workspaces", "--if-present"];
const result = spawnSync(executable, args, {
  env: environment,
  stdio: "inherit"
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
