/*
 *
 * Helper: `initiateNahdi`.
 *
 */
import createConsoleMessage from "./createConsoleMessage.mjs";
import { getNahdiProviders } from "./exsysApiClient.mjs";
import { saveProviders } from "./configStore.mjs";

export default async function initiateNahdi() {
  try {
    const providers = await getNahdiProviders();
    await saveProviders(providers);

    createConsoleMessage(
      "success",
      `Loaded ${providers.length} provider(s) from initiate_nahdi into config.json`,
    );
  } catch (err) {
    createConsoleMessage(
      "error",
      `Failed to call Exsys initiate_nahdi — ${err.message}`,
    );
    process.exit(1);
  }
}
