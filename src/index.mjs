/**
 *
 * Index: The main entry point of the application
 *
 */
import "./env.mjs";
import handleProcessErrors from "./handleProcessErrors.mjs";
import runPrescriptionPoll from "./pollPrescriptions.mjs";
import pollSalesInvoices from "./pollSalesInvoices.mjs";

(() => {
  handleProcessErrors();
  runPrescriptionPoll();
  pollSalesInvoices();
})();
