/*
 *
 * Helper: `pollPrescriptions`.
 *
 */
import createConsoleMessage from "./createConsoleMessage.mjs";
import {
  getPrescriptionsNotSent,
  getPrescriptionData,
  postPrescriptionDataToExsys,
} from "./exsysApiClient.mjs";
import { sendPrescription } from "./nahdiApiClient.mjs";
import logResult from "./logResult.mjs";
import { PRESCRIPTION_POLL_INTERVAL_MS } from "./constants.mjs";

const LOG_IN_RESULT = false;

async function pollPrescriptions() {
  createConsoleMessage("info", "Polling for prescriptions...");

  const pollLog = {
    startedAt: new Date().toISOString(),
    prescriptions: [],
  };

  let prescriptions = [];

  try {
    prescriptions = await getPrescriptionsNotSent();
  } catch (err) {
    createConsoleMessage(
      "error",
      `Failed to fetch prescriptions list — ${err.message}`,
    );

    if (LOG_IN_RESULT) {
      pollLog.error = err.message;
      await logResult("prescriptions", pollLog);
    }
    return;
  }

  if (!prescriptions.length) {
    createConsoleMessage("info", "No pending prescriptions found.");
    return;
  }

  createConsoleMessage(
    "info",
    `Found ${prescriptions.length} prescription(s) to process.`,
  );

  for (const { organization_no, visit_id } of prescriptions) {
    createConsoleMessage(
      "info",
      `Fetching prescription data for visit_id: ${visit_id} | org: ${organization_no}`,
    );

    const prescriptionLog = {
      organization_no,
      visit_id,
      prescriptionData: null,
      nahdiResult: null,
      exsysSaveData: null,
      exsysSaveResult: null,
    };

    let prescriptionData = null;

    try {
      prescriptionData = await getPrescriptionData(organization_no, visit_id);
    } catch (err) {
      createConsoleMessage(
        "error",
        `Failed to get prescription data for visit_id: ${visit_id} — ${err.message}`,
      );
      prescriptionLog.exsysPrescriptionDataError = err.message;
      pollLog.prescriptions.push(prescriptionLog);
      continue;
    }

    prescriptionLog.prescriptionData = prescriptionData || null;

    if (!prescriptionData) {
      createConsoleMessage(
        "warning",
        `No data returned for visit_id: ${visit_id}, skipping.`,
      );
      prescriptionLog.exsysPrescriptionDataError =
        "No prescription data returned.";
      pollLog.prescriptions.push(prescriptionLog);
      continue;
    }

    let nahdiResult = null;
    let nahdiError = undefined;

    try {
      nahdiResult = await sendPrescription(prescriptionData);
      createConsoleMessage(
        "success",
        `Prescription sent for visit_id: ${visit_id}`,
      );

      prescriptionLog.nahdiResult = nahdiResult;

      if (!nahdiResult?.OrderNumber) {
        nahdiError = "No OrderNumber returned from Nahdi.";
        createConsoleMessage(
          "warning",
          `visit_id: ${visit_id} — ${nahdiError}`,
        );
      }
    } catch (err) {
      createConsoleMessage(
        "error",
        `Failed to send prescription for visit_id: ${visit_id} — ${err.message}`,
      );
      nahdiError = err.message;
    }

    try {
      const dataSentToExsys = {
        organization_no,
        visit_id,
        ...(nahdiResult || {}),
        nahdiError,
      };

      prescriptionLog.exsysSaveData = dataSentToExsys;

      const exsysSaveResponse =
        await postPrescriptionDataToExsys(dataSentToExsys);

      prescriptionLog.exsysSaveResult = exsysSaveResponse;

      createConsoleMessage(
        "success",
        `Prescription data saved to Exsys for visit_id: ${visit_id}`,
      );
    } catch (err) {
      const exsysErrorBody = err.response?.data;

      createConsoleMessage(
        "error",
        `Failed to save prescription to Exsys for visit_id: ${visit_id} — ${err.message}`,
      );

      if (exsysErrorBody) {
        createConsoleMessage(
          "error",
          `Exsys error body: ${JSON.stringify(exsysErrorBody)}`,
        );
      }

      prescriptionLog.exsysSaveError = err.message;
      prescriptionLog.exsysErrorResponse = exsysErrorBody ?? null;
    }

    pollLog.prescriptions.push(prescriptionLog);
  }

  if (LOG_IN_RESULT) {
    pollLog.finishedAt = new Date().toISOString();
    await logResult("prescriptions", pollLog);
  }
}

function runPrescriptionPoll() {
  createConsoleMessage(
    "info",
    `Prescription poller started — interval: ${PRESCRIPTION_POLL_INTERVAL_MS / 1000}s`,
  );
  pollPrescriptions();
  setInterval(pollPrescriptions, PRESCRIPTION_POLL_INTERVAL_MS);
}

export default runPrescriptionPoll;
