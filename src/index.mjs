/**
 *
 * Index: The main entry point of the application
 *
 */
import "./env.mjs";
import handleProcessErrors from "./handleProcessErrors.mjs";
import initiateNahdi from "./initiateNahdi.mjs";
import runPrescriptionPoll from "./pollPrescriptions.mjs";
import pollSalesInvoices from "./pollSalesInvoices.mjs";
import runItemsSohPoll from "./pollItemsSoh.mjs";

(async () => {
  handleProcessErrors();
  await initiateNahdi();
  runPrescriptionPoll();
  pollSalesInvoices();
  runItemsSohPoll();
})();
