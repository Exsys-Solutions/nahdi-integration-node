/*
 *
 * Helpers: `exsysApiClient`.
 *
 */
import axios from "axios";

const exsysBaseDB = process.env.EXSYS_BASE_DB;

if (!exsysBaseDB) {
  throw new Error("Missing required env variable: EXSYS_BASE_DB");
}

const AUTHORIZATION = process.env.AUTHORIZATION;

if (!AUTHORIZATION) {
  throw new Error("Missing required env variable: AUTHORIZATION");
}

const EXSYS_BASE_URL = `${exsysBaseDB}/ex_nahdi_integration`;

const exsysApiClient = axios.create({
  baseURL: EXSYS_BASE_URL,
  params: { authorization: AUTHORIZATION },
});

async function exsysGet(endpoint, params = {}) {
  const { data } = await exsysApiClient.get(endpoint, { params });
  return data ?? null;
}

export async function getPrescriptionsNotSent() {
  const data = await exsysGet("/get_prescription_not_send");
  return data?.data ?? [];
}

export async function getPrescriptionData(organization_no, visit_id) {
  return exsysGet("/get_prescription_data", { organization_no, visit_id });
}

export async function postPrescriptionDataToExsys(payload) {
  const { data } = await exsysApiClient.post(
    "/prescription_response_dml",
    payload,
  );

  return data;
}

export async function getSalesInvoicesNotArrived() {
  const data = await exsysGet("/sales_invoices_not_arrived");
  return data?.data ?? [];
}

export async function postSalesInvoiceDataToExsys(payload) {
  const { data } = await exsysApiClient.post("/sales_invoices_dml", payload);

  return data;
}
