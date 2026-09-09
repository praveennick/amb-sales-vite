# AMB Sales

Responsive React and Tailwind CSS workspace for daily sales, expenses, inventory, and reporting across three shops.

## Run locally

Use Node.js 22 or newer, then run:

```sh
npm install
npm run dev
```

On Windows with PowerShell script restrictions, use `npm.cmd` instead of `npm`.

## Structure

- `src/pages/`: login, shop selection, sales entry, dashboard, expenses, inventory, and sales records.
- `src/components/`: shared layout, loading/error states, and lightweight SVG charts.
- `src/context/`: one shared Firebase authentication subscription and session state.
- `src/services/`: database initialization, bounded report reads, and on-demand Excel export.
- `src/lib/`: reusable shop definitions, dates, currency, sales, and stock calculations.
- `src/index.css`: Tailwind theme, base rules, and shared utility compositions.
- `tests/`: calculation tests, isolated browser fixtures, and production smoke tests.

JSX uses `.jsx` files, so Vite no longer needs a custom JSX loader for `.js` files. Pages load on demand through React lazy/Suspense; database and Excel code are excluded from the initial login bundle. The chart UI uses SVG with Tailwind classes and accessible exact-value tables.

## Behavior and data compatibility

Existing URLs and Firestore paths are preserved:

- Sales: `shops/{shopName}/{DD-MM-YYYY}/data`.
- Expenses: `dailySpends/{DD-MM-YYYY}/spends/{id}`.
- Inventory: `inventory/{shopName}/items/{id}`.

Sales saves still replace the existing record for the selected shop and date. Cash is notes + expenses − counter cash; total sales are cash + UPI + card; the POS difference recalculates whenever any input changes. Monetary values round to two decimal places. Inventory Cancel discards draft changes.

Dashboard reads use eight concurrent requests, deduplicate overlapping dates, debounce changes, stop queued work on navigation, and reject ranges over 366 days. Expense dates within the same month reuse loaded data; successful mutations update local results without fetching the month again. Refresh retrieves current server data. The existing date-subcollection schema still requires per-day reads; this refactor does not migrate stored data.

Dashboard, expenses, inventory, and sales records require an admin session. `src/adminEmails.js` retains the existing admin list. Client-side route checks complement Firestore Security Rules; backend rules were not available in this repository and were not changed.

The unused component that automatically imported JSON on mount was removed. `src/csvjson.json` is retained unchanged and is not loaded or submitted by the application.

## Validation

```sh
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:production
```

Browser tests use installed Google Chrome in headless mode. `test:e2e` uses a separate Vite configuration with an in-memory Firebase fixture; these aliases are not used by normal development or production. The tests exercise mobile and desktop navigation, route protection, sales reconciliation, inventory cancellation, expense CRUD, error recovery, and actual Excel downloads. Production smoke tests load the real built login screen at 320, 390, 768, and 1440 pixels with external requests blocked. Live sign-in and production database writes are not tested.

The initial build before restructuring shipped 1,968.78 kB of JavaScript (558.94 kB gzip). The refactored login entry is approximately 448 kB (125 kB gzip); database code and Excel exports load separately. These are build-size measurements, not claims about live network latency. `dist/.vite/manifest.json` records the chunk graph.

Implementation references: [React lazy](https://react.dev/reference/react/lazy), [Vite dynamic import handling](https://vite.dev/guide/features), and [write-excel-file](https://github.com/catamphetamine/write-excel-file).
