/*
 *
 * Helper: `handleProcessErrors`.
 *
 */
import createConsoleMessage from "./createConsoleMessage.mjs";
import logResult from "./logResult.mjs";

function logCrash(type, err) {
  const message = err?.stack || err?.message || String(err);

  createConsoleMessage("error", `${type} — ${message}`);

  logResult("crash", {
    type,
    message: err?.message || String(err),
    stack: err?.stack || null,
    occurredAt: new Date().toISOString(),
  }).catch(() => {});
}

export default function handleProcessErrors() {
  process.on("uncaughtException", (err) => logCrash("uncaughtException", err));
  process.on("unhandledRejection", (err) => logCrash("unhandledRejection", err));
}
