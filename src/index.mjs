/**
 *
 * Index: The main entry point of the application
 *
 */
import "./env.mjs";
import runPrescriptionPoll from "./pollPrescriptions.mjs";
import pollSalesInvoices from "./pollSalesInvoices.mjs";

(() => {
  runPrescriptionPoll();
  pollSalesInvoices();
})();
