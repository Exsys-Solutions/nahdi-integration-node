/*
 *
 * Helpers: `nahdiApiClient`.
 *
 */
import axios from "axios";

const NAHDI_BASE_URL = "https://m2.nahdi.sa/ProvidersIntegration/Home";

const nahdiApiClient = axios.create({ baseURL: NAHDI_BASE_URL });

export async function sendPrescription(payload) {
  const { data } = await nahdiApiClient.post(
    "/SendPrescription_clinics",
    payload,
  );
  return data ?? null;
}

export async function getSalesInvoices({
  provider_id,
  provider_token,
  PrescriptionID,
}) {
  const { data } = await nahdiApiClient.get("/GetSalesInvoices", {
    params: {
      provider_ID: provider_id,
      provider_Token: provider_token,
      PrescriptionID,
      SalesDate: "",
      InvoiceNo: "",
      FileNo: "",
      CreditOnly: "",
      PrescriptionOnly: "",
      UpdatedVisitsLastHours: "",
      isDate: "",
    },
  });
  return data ?? null;
}
