/*
 *
 * Helper: `logResult`.
 *
 */
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RESULTS_DIR = path.join(PROJECT_ROOT, "results");

export default async function logResult(name, data) {
  await mkdir(RESULTS_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(RESULTS_DIR, `${name}_${timestamp}.json`);

  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
