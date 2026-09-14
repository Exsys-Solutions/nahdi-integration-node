# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Node.js server that integrates Al-Nahdi's provider APIs with Exsys (the pharmacy/clinic backend). It has no HTTP server of its own — it runs two independent polling loops that move data one direction: Exsys → Nahdi → Exsys.

## Commands

- Run the server (dev, via nodemon, ignores `results/`): `yarn start`
- No test suite, linter, or build step is configured in this repo.

## Environment

Config is loaded via `dotenv` (`src/env.mjs`, imported first in `src/index.mjs`). Copy `.env.example` to `.env` and fill in:

- `EXSYS_BASE_DB` — base URL for the Exsys instance; the client appends `/ex_nahdi_integration`.
- `AUTHORIZATION` — sent as an `authorization` query param on every Exsys request.
- `PRESCRIPTION_POLL_INTERVAL_MIN` — prescription poll interval in minutes (default 5).
- `SALES_INVOICES_POLL_INTERVAL_MIN` — sales invoice poll interval in minutes (default 12).

`EXSYS_BASE_DB` and `AUTHORIZATION` are required — `src/exsysApiClient.mjs` throws at import time if either is missing. The Nahdi base URL (`https://m2.nahdi.sa/ProvidersIntegration/Home`) is hardcoded, not env-configured.

## Architecture

Everything lives in `src/` as flat ES modules (`"type": "module"`, no bundler/TS). `src/index.mjs` just imports `env.mjs` for side effects and starts both pollers.

Two parallel, self-scheduling poll loops (`runPrescriptionPoll` in `pollPrescriptions.mjs`, `runSalesInvoicesPoll` in `pollSalesInvoices.mjs`) each run once immediately then repeat on their own `setInterval`. Both loops follow the same shape:

1. Ask Exsys for pending work (`getPrescriptionsNotSent` / `getSalesInvoicesNotArrived` in `exsysApiClient.mjs`).
2. For each item, call Nahdi (`sendPrescription` / `getSalesInvoices` in `nahdiApiClient.mjs`).
3. Write the Nahdi result (or the error) back to Exsys (`postPrescriptionDataToExsys` / `postSalesInvoiceDataToExsys`).

Each step is wrapped in its own try/catch so one item's failure doesn't stop the loop or block writing an error status back to Exsys — the `nahdiError` field is threaded through and always included in the Exsys save payload, even on success paths where it's `undefined`.

`exsysApiClient.mjs` and `nahdiApiClient.mjs` are the only two modules that talk to the network; both wrap a dedicated `axios` instance. Keep new external calls inside these two files rather than calling `axios` directly from the poll loops.

Two small cross-cutting helpers:
- `createConsoleMessage.mjs` — the only logging mechanism; use its `info`/`success`/`warning`/`error` levels instead of raw `console.log`.
- `logResult.mjs` — dumps a full poll run's log object to `results/<name>_<timestamp>.json`. Currently gated off by a `LOG_IN_RESULT = false` constant at the top of each poll file; flip that constant (not the env) to enable JSON dumps for a given poller.
