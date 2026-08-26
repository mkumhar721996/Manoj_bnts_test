# MT-STORY-052 — Add Expense — Implementation Plan

## Codebase fit

This repo is an Express app that server-renders plain HTML pages (no client-side JS
framework) — see `src/routes/web.js`, `src/views/pages/*Page.js`, `src/views/layout.js`.
Each prior story added its own in-memory store (`src/store/userStore.js`, keyed Map,
with a `reset()` for tests), its own validator (`src/validation/*Validator.js`, a
`validate(payload)` function returning `{ errors, ...fields }`), its own page renderer(s),
and wired routes directly into `src/routes/web.js`. Tests live one-per-feature in
`tests/*.test.js`, use `supertest` against `require('../src/app')`, submit with
`.type('form')`, and reset stores in `beforeEach`. There is no expense-related code yet
anywhere in the repo, so this is new: store, validator, two page renderers, and three
routes, following the exact same conventions as `cartPage.js` / `checkoutPage.js` /
`deliveryDetailsValidator.js`.

Design decisions made to fit the ACs into this server-rendered pattern (no client JS):

- **"Tap the add-expense action" (AC1)** is realized as a link (`GET /expenses/new`)
  on the list page, matching how `/cart` and `/checkout` are separate rendered pages
  rather than a JS-toggled modal.
- **"Active period filter" (AC2/AC3)** — no story before this one introduced a period
  switcher, and none of the ACs ask for one, so the only filter in scope is the implicit
  default: the current calendar month, computed from the server clock. `GET /expenses`
  always shows this month's expenses and this month's total. Building a period-switching
  UI would be speculative and out of scope for "Add Expense."
- **"Top of list" (AC2)** means most-recently-added first, so `expenseStore.save()`
  unshifts, independent of the date entered (works together with AC5's unrestricted
  dates).
- On successful `POST /expenses`, the server directly renders the updated list page
  (200), the same pattern `POST /checkout` already uses instead of an HTTP redirect.
- Category and note are plain text fields (like `streetAddress`/`deliveryInstructions`
  in `deliveryDetailsValidator.js`), not a fixed enum — no AC requires a category enum,
  so introducing one would be speculative.

## New files

- `src/store/expenseStore.js` — in-memory store: `save(expense)` (unshift), `reset()`,
  `listForCurrentPeriod()`, `totalForCurrentPeriod()` (both scoped to the current
  calendar month via `expense.date.slice(0, 7)` vs. today's `YYYY-MM`).
- `src/validation/expenseValidator.js` — `validate(payload)` → `{ errors, amount,
  category, date, note }`. Rules: `amount` required and must parse to a finite number
  > 0; `category` required (trimmed non-empty string); `date` required and must match
  `YYYY-MM-DD` (format check only — no min/max, so any past/today/future date passes);
  `note` optional, trimmed, defaults to `''`.
- `src/views/pages/addExpensePage.js` — `renderAddExpensePage({ errors, values })`:
  form (`action="/expenses" method="post" novalidate`) with labeled `amount`,
  `category`, `date` (`type="date"`, no `min`/`max`), and `note` fields, each following
  the `.field`/`.field-error`/`aria-invalid` pattern from `cartPage.js`.
- `src/views/pages/expensesPage.js` — `renderExpensesPage({ expenses, total })`: heading,
  an `id="add-expense-action"` link to `/expenses/new`, an `id="period-total"` total
  display, and either an `id="expense-list"` list of expenses (amount/category/date/note)
  or, when empty, an `id="empty-expenses"` message "No expenses yet — add your first one".
- `tests/expenses.test.js` — new test file, `beforeEach(() => expenseStore.reset())`.

## Modified files

- `src/routes/web.js` — add `GET /expenses`, `GET /expenses/new`, `POST /expenses`,
  wired the same way `/cart` and `/checkout` are today (requires `crypto`, already
  imported).

No changes needed to `src/app.js` (`web.js` is already mounted at `/`) or `layout.js`.

## Per-AC TDD plan

### AC1 — tapping add-expense shows a form with amount/category/date/note

**(a) Failing tests** (`tests/expenses.test.js`):
- `GET /expenses` → 200, response body contains `id="add-expense-action"` and
  `href="/expenses/new"`.
- `GET /expenses/new` → 200, `content-type` matches `/html/`, body matches labeled
  inputs for `name="amount"`, `name="category"`, `type="date"` `name="date"`, and a
  `name="note"` field.

**(b) Minimal code**: `expensesPage.js` with the add-expense link; `addExpensePage.js`
with the four fields; `GET /expenses` and `GET /expenses/new` routes in `web.js` (list
route can render with an empty array/0 total at this point — filled in by AC7).

**(c) Files**: `src/views/pages/expensesPage.js`, `src/views/pages/addExpensePage.js`,
`src/routes/web.js`, `tests/expenses.test.js`.

### AC7 — empty list shows "No expenses yet — add your first one"

**(a) Failing test**: with a freshly reset store, `GET /expenses` → 200, body contains
`No expenses yet — add your first one` and does not render an `id="expense-list"`.

**(b) Minimal code**: `expenseStore.js` (`reset`, `listForCurrentPeriod` returning `[]`,
`totalForCurrentPeriod` returning `0`); `expensesPage.js` renders the empty-state message
when `expenses.length === 0`; `GET /expenses` route wires the store into the page.

**(c) Files**: `src/store/expenseStore.js`, `src/views/pages/expensesPage.js`,
`src/routes/web.js`.

### AC4 — missing amount / category / date blocks save with a validation error

**(a) Failing tests**: table-driven like `tests/registration.test.js`'s "AC3: required
field missing" — for each of `['amount', 'category', 'date']`, build a valid payload,
blank that field, `POST /expenses` (`.type('form')`), assert `res.status === 400` and
the body contains the matching message (`Amount is required.` / `Category is required.`
/ `Date is required.`), then `GET /expenses` and assert the empty-state message is still
shown (nothing was saved).

**(b) Minimal code**: `expenseValidator.js` required-field checks; `POST /expenses`
route: on `errors.length > 0`, respond 400 with `renderAddExpensePage({ errors, values })`
without calling `expenseStore.save`.

**(c) Files**: `src/validation/expenseValidator.js`, `src/views/pages/addExpensePage.js`
(error rendering), `src/routes/web.js`.

### AC2 — valid submission puts the new expense at the top of the list

**(a) Failing test**: `POST /expenses` with a valid payload A (amount `10`, category
`Food`, date = today, no note) → 200; then `POST /expenses` with valid payload B (amount
`20`, category `Transport`, date = today) → 200; assert in payload B's response body
that `Transport` appears before `Food` (e.g. compare `res.text.indexOf('Transport')` <
`res.text.indexOf('Food')`).

**(b) Minimal code**: `expenseStore.save()` unshifts; `POST /expenses` on success calls
`expenseStore.save({ id: crypto.randomUUID(), amount, category, date, note })` then
renders `renderExpensesPage` with `listForCurrentPeriod()`.

**(c) Files**: `src/store/expenseStore.js`, `src/routes/web.js`,
`src/views/pages/expensesPage.js`.

### AC3 — period total updates to include the new expense

**(a) Failing test**: `POST /expenses` payload A (amount `10`, date = today), then
payload B (amount `20.50`, date = today); assert payload B's response body contains the
`id="period-total"` total reflecting `30.50` (e.g. `Total this period: $30.50`).

**(b) Minimal code**: `expenseStore.totalForCurrentPeriod()` sums `amount` over
`listForCurrentPeriod()`; `expensesPage.js` renders `total.toFixed(2)` in the
`id="period-total"` element; `POST /expenses` passes the recomputed total into the
re-rendered list page.

**(c) Files**: `src/store/expenseStore.js`, `src/views/pages/expensesPage.js`,
`src/routes/web.js`.

### AC5 — any calendar date (past, today, future) is accepted without restriction

**(a) Failing tests**:
- Unit test of `expenseValidator.validate` directly: `date: '2000-01-01'` (past) and
  `date: '2999-12-31'` (future) both produce no date-related error (alongside an
  otherwise-valid payload).
- Integration test: `POST /expenses` with a valid payload where `date` is a past date
  (e.g. `'2000-01-01'`) → 200, response body does not contain `Date is required.`

**(b) Minimal code**: `expenseValidator.js`'s date check is format-only
(`/^\d{4}-\d{2}-\d{2}$/`), with no comparison against "today"; the `addExpensePage.js`
date `<input type="date">` has no `min`/`max` attribute.

**(c) Files**: `src/validation/expenseValidator.js`, `src/views/pages/addExpensePage.js`,
`tests/expenses.test.js`.

### AC6 — a saved expense is still present after closing and reopening the browser

**(a) Failing test**: `POST /expenses` with a valid payload (date = today) → 200; then,
as a separate `request(app)` call with no cookies/session carried over (simulating a
fresh browser), `GET /expenses` → 200, body still contains that expense's category.

**(b) Minimal code**: none beyond the above — `expenseStore` is module-level in-memory
state (like `userStore`), not tied to any per-request session, so data written by one
request is visible to the next as long as the process is alive. This test simply proves
that property holds for expenses too.

**(c) Files**: `tests/expenses.test.js` only (exercises existing `expenseStore.js` /
`web.js` code from earlier ACs).

## Build order

AC1 → AC7 → AC4 → AC2 → AC3 → AC5 → AC6, since each step's minimal code is a strict
superset of the previous one's (form → empty list → validation → save/order → total →
date flexibility → a persistence assertion over already-working code).
