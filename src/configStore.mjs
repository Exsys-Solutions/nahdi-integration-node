/*
 *
 * Helper: `configStore`.
 *
 */
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const CONFIG_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "config.json",
);

export async function saveProviders(providers) {
  await writeFile(CONFIG_PATH, JSON.stringify(providers, null, 2), "utf-8");
}

export async function getProviders() {
  const raw = await readFile(CONFIG_PATH, "utf-8");
  return JSON.parse(raw);
}
