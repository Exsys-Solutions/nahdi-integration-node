/*
 *
 * Helper: `logResult`.
 *
 */
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const RESULTS_DIR = path.resolve("results");

export default async function logResult(name, data) {
  await mkdir(RESULTS_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(RESULTS_DIR, `${name}_${timestamp}.json`);

  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}
