# AMB Sales

Responsive React and Tailwind CSS workspace for daily sales, expenses, inventory, and reporting across three stores.

## Run locally

Use Node.js 22 or newer, then run:

```sh
npm install
npm run dev
```

On Windows with PowerShell script restrictions, use `npm.cmd` instead of `npm`.

## Structure

- `src/pages/`: login, store selection, sales entry, dashboard, expenses, inventory, and sales records.
- `src/components/`: shared layout, loading/error states, and lightweight SVG charts.
- `src/context/`: one shared Firebase authentication subscription and session state.
- `src/services/`: database initialization, bounded report reads, and on-demand Excel export.
- `src/lib/`: reusable store definitions, dates, currency, sales, and stock calculations.
- `src/index.css`: Tailwind theme, base rules, and shared utility compositions.
- `tests/`: calculation tests, isolated browser fixtures, and production smoke tests.

JSX uses `.jsx` files, so Vite no longer needs a custom JSX loader for `.js` files. Pages load on demand through React lazy/Suspense; database and Excel code are excluded from the initial login bundle. The chart UI uses SVG with Tailwind classes and accessible exact-value tables. The colorful theme combines dark indigo navigation, violet/cyan gradients, tinted summary cards, and section/action icons.

Visible dates use `DD/MM/YY`; the shared date field preserves native calendar selection while preventing Safari's native date text from stretching the layout. Chart labels include short weekdays (Mon, Tue, etc.). Whole currency amounts omit `.00`; real fractional amounts remain visible. Exports follow the same date and currency presentation.

## Behavior and data compatibility

Routes use /stores, /sales/:store, /expenses, and /sales-records. Previous URLs redirect to their new equivalents. Dashboard, inventory, and login URLs remain the same. Store wording is used throughout the interface and exports; existing Firestore paths and field names are preserved:

- Sales: `shops/{shopName}/{DD-MM-YYYY}/data`.
- Expenses: `dailySpends/{DD-MM-YYYY}/spends/{id}`.
- Inventory: `inventory/{shopName}/items/{id}`.

Sales saves still replace the existing record for the selected shop and date. Cash is notes + expenses − counter cash; total sales are cash + UPI + card. Difference from POS is the signed difference: total sales minus POS sales. Reports and exports retain the stored remaining field. Existing database records are not rewritten. Monetary values round to two decimal places internally. Inventory Cancel discards draft changes.

Dashboard reads use eight concurrent requests, deduplicate overlapping dates, debounce changes, stop queued work on navigation, and reject ranges over 366 days. Expense dates within the same month reuse loaded data; successful mutations update local results without fetching the month again. Refresh retrieves current server data. The existing date-subcollection schema still requires per-day reads; this refactor does not migrate stored data.

Dashboard, expenses, inventory, sales records, and admin management require an admin role stored in Firestore. Follow [Firebase admin setup](docs/admin-access.md) before deploying this frontend. The first admin must be bootstrapped in Firebase; subsequent access is managed in the app. Sales records include confirmed deletion per store and date.

The unused component that automatically imported JSON on mount was removed. `src/csvjson.json` is retained unchanged and is not loaded or submitted by the application.

## Validation

```sh
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:production
```

Browser tests use installed Google Chrome in headless mode plus Playwright WebKit for the mobile date and chart checks. Install WebKit once with `npx playwright install webkit`. `test:e2e` uses a separate Vite configuration with an in-memory Firebase fixture; these aliases are not used by normal development or production. The tests exercise mobile and desktop navigation, route protection, sales reconciliation, inventory cancellation, expense CRUD, error recovery, and actual Excel downloads. Production smoke tests load the real built login screen at 320, 390, 768, and 1440 pixels with external requests blocked. Live sign-in and production database writes are not tested.

The initial build before restructuring shipped 1,968.78 kB of JavaScript (558.94 kB gzip). The refactored login entry is approximately 459 kB (129 kB gzip); database code and Excel exports load separately. These are build-size measurements, not claims about live network latency. `dist/.vite/manifest.json` records the chunk graph.

Implementation references: [React lazy](https://react.dev/reference/react/lazy), [Vite dynamic import handling](https://vite.dev/guide/features), and [write-excel-file](https://github.com/catamphetamine/write-excel-file).
