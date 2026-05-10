/*
 *
 * Helper: `pollSalesInvoices`.
 *
 */
import createConsoleMessage from "./createConsoleMessage.mjs";
import {
  getSalesInvoicesNotArrived,
  postSalesInvoiceDataToExsys,
} from "./exsysApiClient.mjs";
import { getSalesInvoices } from "./nahdiApiClient.mjs";
import logResult from "./logResult.mjs";
import { SALES_INVOICES_POLL_INTERVAL_MS } from "./constants.mjs";

const LOG_IN_RESULT = false;

async function pollSalesInvoices() {
  createConsoleMessage("info", "Polling for sales invoices...");

  const pollLog = {
    startedAt: new Date().toISOString(),
    invoices: [],
  };

  let invoices = [];

  try {
    invoices = await getSalesInvoicesNotArrived();
  } catch (err) {
    createConsoleMessage(
      "error",
      `Failed to fetch sales invoices list — ${err.message}`,
    );

    if (LOG_IN_RESULT) {
      pollLog.error = err.message;
      await logResult("sales_invoices", pollLog);
    }
    return;
  }

  if (!invoices.length) {
    createConsoleMessage("info", "No pending sales invoices found.");
    return;
  }

  createConsoleMessage(
    "info",
    `Found ${invoices.length} invoice(s) to process.`,
  );

  for (const {
    organization_no,
    visit_id,
    PrescriptionID,
    provider_id,
    provider_token,
  } of invoices) {
    createConsoleMessage(
      "info",
      `Fetching Nahdi invoice for PrescriptionID: ${PrescriptionID} | org: ${organization_no}`,
    );

    const invoiceLog = {
      organization_no,
      visit_id,
      PrescriptionID,
      nahdiResult: null,
      exsysSaveData: null,
      exsysSaveResult: null,
    };

    let nahdiInvoiceData = null;
    let nahdiError = undefined;

    try {
      nahdiInvoiceData = await getSalesInvoices({
        provider_id,
        provider_token,
        PrescriptionID,
      });
    } catch (err) {
      createConsoleMessage(
        "error",
        `Failed to get Nahdi invoice for PrescriptionID: ${PrescriptionID} — ${err.message}`,
      );
      nahdiError = err.message;
    }

    if (nahdiInvoiceData) {
      invoiceLog.nahdiResult = nahdiInvoiceData;

      if (nahdiInvoiceData.error) {
        createConsoleMessage(
          "warning",
          `Nahdi returned an error for PrescriptionID: ${PrescriptionID} — ${nahdiInvoiceData.error}`,
        );
        nahdiError = nahdiInvoiceData.error;
      } else if (!nahdiInvoiceData.Invoices?.length) {
        createConsoleMessage(
          "warning",
          `No invoices returned from Nahdi for PrescriptionID: ${PrescriptionID}`,
        );
        nahdiError = "Empty Invoices array returned from Nahdi.";
      } else {
        createConsoleMessage(
          "success",
          `Invoice fetched for PrescriptionID: ${PrescriptionID}`,
        );
      }
    }

    invoiceLog.nahdiError = nahdiError;

    try {
      const dataSentToExsys = {
        organization_no,
        visit_id,
        PrescriptionID,
        ...(nahdiInvoiceData || {}),
        nahdiError,
      };

      invoiceLog.exsysSaveData = dataSentToExsys;

      createConsoleMessage("info", `Sending data to Exsys`);

      const exsysSaveResponse =
        await postSalesInvoiceDataToExsys(dataSentToExsys);

      invoiceLog.exsysSaveResult = exsysSaveResponse;

      createConsoleMessage(
        "success",
        `Invoice data saved to Exsys for PrescriptionID: ${PrescriptionID}`,
      );
    } catch (err) {
      const exsysErrorBody = err.response?.data;

      createConsoleMessage(
        "error",
        `Failed to save invoice to Exsys for PrescriptionID: ${PrescriptionID} — ${err.message}`,
      );

      if (exsysErrorBody) {
        createConsoleMessage(
          "error",
          `Exsys error body: ${JSON.stringify(exsysErrorBody)}`,
        );
      }

      invoiceLog.exsysSaveError = err.message;
      invoiceLog.exsysErrorResponse = exsysErrorBody ?? null;
    }

    pollLog.invoices.push(invoiceLog);
  }

  if (LOG_IN_RESULT) {
    pollLog.finishedAt = new Date().toISOString();
    await logResult("sales_invoices", pollLog);
  }
}

function runSalesInvoicesPoll() {
  createConsoleMessage(
    "info",
    `Sales invoices poller started — interval: ${SALES_INVOICES_POLL_INTERVAL_MS / 1000}s`,
  );
  pollSalesInvoices();
  setInterval(pollSalesInvoices, SALES_INVOICES_POLL_INTERVAL_MS);
}

export default runSalesInvoicesPoll;
