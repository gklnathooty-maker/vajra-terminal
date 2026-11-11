#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = dirname(__dirname);

const PORT = 8080;
const URL = `http://127.0.0.1:${PORT}/`;

async function isServerRunning() {
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(1500) });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function startServer() {
  console.log("[desktop] Starting GOKS CHART desk server...");
  const child = spawn(
    process.execPath,
    [join(ROOT_DIR, "scripts", "with-app-env.mjs"), "vite", "dev", "--host", "0.0.0.0", "--port", String(PORT)],
    {
      cwd: ROOT_DIR,
      stdio: "ignore",
      detached: true,
      windowsHide: true,
    }
  );
  child.unref();

  // Wait for server to become responsive
  const start = Date.now();
  while (Date.now() - start < 15000) {
    if (await isServerRunning()) {
      console.log("[desktop] Server is ready on " + URL);
      return true;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

function findBrowserBinary() {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    join(process.env.LOCALAPPDATA || "", "Microsoft\\Edge\\Application\\msedge.exe"),
    join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return null;
}

async function main() {
  const running = await isServerRunning();
  if (!running) {
    const ok = await startServer();
    if (!ok) {
      console.error("[desktop] Failed to connect to server on " + URL);
      process.exit(1);
    }
  } else {
    console.log("[desktop] Connected to running GOKS CHART server on " + URL);
  }

  const binary = findBrowserBinary();
  if (!binary) {
    console.error("[desktop] No Edge or Chrome executable found. Opening in default browser...");
    const cmd = process.platform === "win32" ? "start" : "open";
    spawn(cmd, [URL], { shell: true, stdio: "ignore" });
    return;
  }

  console.log("[desktop] Launching native standalone window with:", binary);
  const dataDir = join(process.env.APPDATA || ".", "goks-chart-desktop");

  const appArgs = [
    `--app=${URL}`,
    "--window-size=1440,920",
    `--user-data-dir=${dataDir}`,
    "--disable-features=TranslateUI",
    "--disable-extensions",
    "--app-auto-launched",
  ];

  const appProcess = spawn(binary, appArgs, {
    detached: true,
    stdio: "ignore",
  });
  appProcess.unref();

  console.log("[desktop] GOKS CHART Desktop Application launched successfully!");
}

main().catch((err) => {
  console.error("[desktop] Error:", err.message);
  process.exit(1);
});

