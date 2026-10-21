/*
 *
 * Helper: `pollItemsSoh`.
 *
 */
import createConsoleMessage from "./createConsoleMessage.mjs";
import { postItemsSohToExsys } from "./exsysApiClient.mjs";
import { getItemsSoh } from "./nahdiApiClient.mjs";
import { getProviders } from "./configStore.mjs";
import logResult from "./logResult.mjs";

const ITEMS_SOH_POLL_INTERVAL_MIN = +(
  process.env.ITEMS_SOH_POLL_INTERVAL_MIN || 70
);
const ITEMS_SOH_POLL_INTERVAL_MS = ITEMS_SOH_POLL_INTERVAL_MIN * 60 * 1000;

const LOG_IN_RESULT = process.env.LOG_RESULT === "Y";

async function pollItemsSoh() {
  createConsoleMessage("info", "Polling for items SOH...");

  const pollLog = {
    startedAt: new Date().toISOString(),
    items: [],
  };

  try {
    let providers = [];

    try {
      providers = await getProviders();
    } catch (err) {
      createConsoleMessage(
        "error",
        `Failed to read providers from config.json — ${err.message}`,
      );
      pollLog.error = err.message;
      return;
    }

    for (const provider of providers) {
      if (!provider || typeof provider !== "object") {
        createConsoleMessage(
          "warning",
          `Skipping malformed provider entry: ${JSON.stringify(provider)}`,
        );
        continue;
      }

      const { organization_no, provider_id, provider_token } = provider;

      createConsoleMessage(
        "info",
        `Fetching items SOH for org: ${organization_no}`,
      );

      const itemLog = {
        organization_no,
        nahdiResult: null,
        exsysSaveData: null,
        exsysSaveResult: null,
      };

      let nahdiResult = null;

      try {
        nahdiResult = await getItemsSoh({ provider_id, provider_token });
        itemLog.nahdiResult = nahdiResult;
      } catch (err) {
        createConsoleMessage(
          "error",
          `Failed to get items SOH for org: ${organization_no} — ${err.message}`,
        );
        itemLog.nahdiError = err.message;
        pollLog.items.push(itemLog);
        continue;
      }

      if (!Array.isArray(nahdiResult?.Items) || !nahdiResult.Items.length) {
        createConsoleMessage(
          "warning",
          `Nahdi returned no items for org: ${organization_no}, skipping Exsys update.`,
        );
        itemLog.nahdiError = "Items is not a non-empty array.";
        pollLog.items.push(itemLog);
        continue;
      }

      try {
        const dataSentToExsys = { ...(nahdiResult || {}), organization_no };
        itemLog.exsysSaveData = dataSentToExsys;

        const exsysSaveResponse = await postItemsSohToExsys(dataSentToExsys);
        itemLog.exsysSaveResult = exsysSaveResponse;

        createConsoleMessage(
          "success",
          `Items SOH saved to Exsys for org: ${organization_no}`,
        );
      } catch (err) {
        const exsysErrorBody = err.response?.data;

        createConsoleMessage(
          "error",
          `Failed to save items SOH to Exsys for org: ${organization_no} — ${err.message}`,
        );

        if (exsysErrorBody) {
          createConsoleMessage(
            "error",
            `Exsys error body: ${JSON.stringify(exsysErrorBody)}`,
          );
        }

        itemLog.exsysSaveError = err.message;
        itemLog.exsysErrorResponse = exsysErrorBody ?? null;
      }

      pollLog.items.push(itemLog);
    }
  } catch (err) {
    createConsoleMessage(
      "error",
      `Unexpected error while polling items SOH — ${err.message}`,
    );
    pollLog.unexpectedError = err.message;
    throw err;
  } finally {
    if (LOG_IN_RESULT) {
      pollLog.finishedAt = new Date().toISOString();
      await logResult("items_soh", pollLog);
    }
  }
}

function runItemsSohPoll() {
  createConsoleMessage(
    "info",
    `Items SOH poller started — interval: ${ITEMS_SOH_POLL_INTERVAL_MS / 1000}s`,
  );
  pollItemsSoh();
  setInterval(pollItemsSoh, ITEMS_SOH_POLL_INTERVAL_MS);
}

export default runItemsSohPoll;
