# SauceDemo Playwright Test Framework

End-to-end UI + API automation framework for
[https://www.saucedemo.com](https://www.saucedemo.com), built with Playwright
and the Page Object Model pattern.

---

## Quick start

```bash
git clone git@github.com:Intzu3999/saucedemo_test_playwright.git
cd saucedemo_test_playwright

# Install playwright
npm ci
npx playwright install --with-deps chromium

# Run test
npm test
```

Filter by tag:

```bash
npx playwright test --grep "@smoke"
npx playwright test --grep "@checkout"
npx playwright test --grep "@bonus"
```

**What you should see after `npm test` (39 tests total):**

- **28 pass** -- everything the framework claims should work, works.
- **11 fail** -- 10 are SauceDemo's *own* known product bugs, tagged
  `@known-bug` (the 11th `@known-bug` test currently passes -- see the note
  under [Expected test results](#expected-test-results) below). They are
  real defects on the site (not framework issues); the tests are asserting
  the correct behaviour and calling them out.

To open the HTML report:

```bash
npx playwright show-report
```

---

## Run modes

| Command | What it runs | Expected result |
|---|---|---|
| `npm test` | Everything (39 tests) | 28 pass + 11 fail (10 known bugs + 1 known-bug that currently passes) |
| `npm run test:ci` | Everything except `@known-bug` (28 tests) | All green -- used by CI |
| `npm run test:known-bugs` | Only `@known-bug` (11 tests) | 10 fail (bug still present) + 1 pass (see note) |
| `npm run test:smoke` | Only `@smoke` (4 tests) | 4 pass |

To pass extra flags to any of these, use `--` after the script name:

```bash
npm test -- --headed         # visible browser
npm test -- --ui             # Playwright's interactive UI mode
npm test -- --debug          # step-through debugger
```

---

## Expected test results

The suite exercises three groups. Every row here is a real test in the code
and this is the healthy state today (Aug 2026).

### 1. Core happy-path & negative scenarios (10 tests, all PASS)

| # | Scenario | Expected result |
|---|---|---|
| 1 | `standard_user` logs in and lands on `/inventory.html` | PASS |
| 2 | Add "Sauce Labs Backpack" to cart, badge shows 1 | PASS |
| 3 | Add 2 products, both appear in cart | PASS |
| 4 | Full happy-path checkout ends on order-complete page | PASS |
| 5 | `invalid_user` sees "Username and password do not match..." | PASS |
| 6 | `locked_out_user` sees the locked-out error | PASS |
| 7 | Missing first name blocks checkout progression | PASS |
| 8 | Bonus -- API user (DummyJSON `/users/1`) drives full checkout | PASS |
| 9 | Bonus -- API contract sanity check | PASS |
| 10 | Login matrix (6 users) all reach expected outcome | PASS x 6 |

### 2. API contract suite (10 tests, all PASS)

`tests/api-carts.spec.js` covers every HTTP verb against DummyJSON `/carts`
using the API client layer in `api/`.

| # | Verb | Endpoint | Expected result |
|---|---|---|---|
| 1 | GET | `/carts?limit=5` | 200, paginated list |
| 2 | GET | `/carts/1` | 200, cart shape |
| 3 | GET | `/carts/user/5` | 200, all carts for user 5 |
| 4 | POST | `/carts/add` | 200, computed totals |
| 5 | PUT | `/carts/1` (merge=true) | 200, existing + new products |
| 6 | PATCH | `/carts/1` (merge=false) | 200, replaced products |
| 7 | DELETE | `/carts/1` | 200, `isDeleted: true` |
| 8 | GET | `/carts/99999` | 404 |
| 9 | GET | `/carts?limit=-1` | Records current behaviour |
| 10 | GET | `/carts?limit=10000` | Records current behaviour |

### 3. Known-bug regression (11 tests, 10 FAIL and 1 PASS -- and this is deliberate)

Each of these tests asserts what a **correctly-working** SauceDemo would do.
When the site's bug is present, the assertion fails red -- exactly the signal
we want. When SauceDemo fixes a bug, the test flips green and we drop the
`@known-bug` tag. Every failing row here is a real product defect, not a
framework issue.

| # | User | Test | Observed / expected behaviour | Result today |
|---|---|---|---|---|
| 1 | problem_user | All 6 product images should be unique | All 6 point to the same placeholder image | **FAIL (known bug)** |
| 2 | problem_user | Add product #3 (Bolt T-Shirt) to cart | Add-to-Cart click has no effect for this product | **FAIL (known bug)** |
| 3 | problem_user | Add product #4 (Fleece Jacket) to cart | Same as above | **FAIL (known bug)** |
| 4 | problem_user | Add product #6 (Red T-Shirt) to cart | Same as above | **FAIL (known bug)** |
| 5 | problem_user | Remove product from cart | Remove button is unwired -- item stays | **FAIL (known bug)** |
| 6 | problem_user | Last-name field accepts input independently | Typed characters route into First-Name field | **FAIL (known bug)** |
| 7 | performance_glitch | Login redirect completes in < 3s | Redirect takes 5+ seconds | **FAIL (known bug)** |
| 8 | performance_glitch | Add-to-cart badge updates in < 3s | Currently meets SLA -- may be action-specific | **PASS (see note)** |
| 9 | error_user | Last-name field is responsive | Field ignores keyboard input | **FAIL (known bug)** |
| 10 | error_user | Empty last name shows inline error | Continue silently navigates back one page | **FAIL (known bug)** |
| 11 | visual_user | 6th product's Add-to-Cart button stays in card | Button overflows the card boundary | **FAIL (known bug)** |

> **Note on test #8:** the click-latency SLA of 3 seconds *is* met on the
> Add-to-Cart action today, even though the login redirect is still slow.
> This is a good example of automation surfacing something manual testing
> can't quantify: SauceDemo's intentional delay may only be wired on some
> actions. If the site regresses, this test will start failing.

---

## Assumptions & rationale

These are the assumptions I made when deciding what each test should PASS or
FAIL on. Read this if you want to understand *why* the results table above
looks the way it does.

### 1. What is being tested

- **The application under test is SauceDemo itself**, a public demo. It is a
  frozen fixture designed to have intentional bugs baked in. My tests
  therefore treat the intentional bugs as **real product defects** and assert
  the correct behaviour -- exactly the same way I would assert against a
  production application.

### 2. Why bugs are not hidden with `test.fail()`

- SauceDemo ships six user accounts. Five of them (`problem`, `performance_glitch`,
  `error`, `visual`, plus the special `locked_out`) intentionally exhibit
  distinct UI or performance bugs. See
  [`test-data/users.json`](./test-data/users.json) for the observed behaviour
  per user.
- **A known bug should be visible as a red fail** in both Playwright's HTML
  report and in Qase.io. That is the only way a reviewer can tell at a glance
  which tests correspond to defects.
- Earlier iterations of this framework wrapped these tests in Playwright's
  `test.fail()` marker, which made the Playwright report show them as
  **green (expected failure)** while Qase showed them as **red (failed)**.
  That inconsistency was removed. Bug present = RED everywhere.
- CI stays green because CI runs `npm run test:ci` which excludes any test
  tagged `@known-bug`. When SauceDemo fixes a bug, the test starts passing,
  we drop the `@known-bug` tag, and CI protects the fix from that point on.

### 3. What "PASS" and "FAIL" mean here

| Verdict | Meaning |
|---|---|
| **PASS** | Feature works exactly as the site's own documentation claims. |
| **FAIL (known bug)** | Feature is intentionally broken by SauceDemo for a specific user. The framework caught it. |
| **FAIL (unexpected)** | A test regression. Would need investigation -- likely a SauceDemo change or a framework issue. |
| **BLOCKED** | Test could not run (upstream dependency down, environment issue). |

### 4. Automation-only finding: `problem_user`'s "random" Add-to-Cart bug is deterministic

The prompt described the `problem_user` Add-to-Cart failure as "random". By
parameterising the test across all 6 products the framework showed the
"randomness" is actually deterministic:

- Products **1 (Backpack), 2 (Bike Light), 5 (Onesie)** -- Add-to-Cart works.
- Products **3 (Bolt T-Shirt), 4 (Fleece Jacket), 6 (Red T-Shirt)** -- click
  is silently swallowed.

This is a documented example of automation adding QA signal that manual
observation missed.

### 5. Other assumptions

- The default password `secret_sauce` is public demo data and is checked in
  to `.env.example` -- not a secret leak.
- `.env` (with the real Qase token) is gitignored and never committed.
- Chromium alone is sufficient for the assignment; Firefox / WebKit projects
  are commented out in `playwright.config.js`.
- The corporate SSL workaround (`IGNORE_HTTPS_ERRORS`) is off by default and
  is only ever needed locally when running behind a proxy that MITMs TLS
  (e.g. Zscaler). CI leaves it off so TLS verification stays strict.

---

## Screenshots -- last CI run + Qase.io integration

The screenshots below are from
[PR #1 -- MVP framework merge](https://github.com/Intzu3999/saucedemo_test_playwright/pull/1),
which is the first end-to-end demonstration of the pipeline.

### CI View Test Reports at Sticky Comment (Playwright and Qase IO Report)

![Sticky PR comment linking to Playwright HTML report + Qase.io public run](./images/pr2-sticky-comment.png)

### Qase.io -- test run created automatically from Playwright

![Qase test run](https://github.com/user-attachments/assets/bb4a39da-40f1-4423-90dd-99ca39c94798)

### Qase.io -- individual test cases with steps

![Qase test cases with steps](https://github.com/user-attachments/assets/e0bf2973-6e40-4632-8e0b-d878b14f39a2)

### Qase.io -- test result dashboard

![Qase test result dashboard](https://github.com/user-attachments/assets/9f298754-7480-4a34-a938-e662db64f511)

<!--
  Space for reviewer-visible screenshots I want to add manually:

  1. Playwright HTML report with the 10 red @known-bug failures visible.
  2. Qase.io view of the same run showing red @known-bug outcomes.
  3. Any additional dashboards / reporter outputs.

  Just drop images into an `images/` folder and reference them:
      ![local screenshot](./images/your-screenshot.png)
-->

---

## Additional information

Everything below is background context for reviewers who want the deeper
picture. Not needed to run the tests.

### Framework overview

- **Language / runtime:** JavaScript on Node.js 20+.
- **Test runner:** `@playwright/test`.
- **Design pattern:** Page Object Model for UI (`pages/*.js`) with a symmetric
  API request layer (`api/*.js`). Locators and HTTP details live inside
  those classes; specs only call semantic methods.
- **Test data:** Externalised as JSON (`test-data/*.json`) and consumed via
  `utils/helpers.js`.
- **Fixtures:** `utils/fixtures.js` extends Playwright's `test` to inject
  pre-configured API clients (`dummyJsonUsers`, `dummyJsonCarts`) the same
  way `page` is injected for UI tests.
- **Reporting:** Playwright HTML + JUnit XML + optional Qase.io TestOps
  publishing.
- **Failure diagnostics:** Screenshots (on failure), videos and traces
  (retained on failure) under `test-results/`.
- **CI/CD:** GitHub Actions workflow (`.github/workflows/playwright.yml`) and
  a Jenkins declarative pipeline (`Jenkinsfile`) both pre-wired.

### Folder structure

```
saucedemo_test_playwright/
├── .github/workflows/       # GitHub Actions CI workflow
├── pages/                   # Page Object Models (UI locators + actions)
│   ├── BasePage.js
│   ├── LoginPage.js
│   ├── InventoryPage.js
│   ├── CartPage.js
│   ├── CheckoutPage.js
│   └── CompletePage.js
├── api/                     # API request objects (POM for HTTP)
│   ├── BaseApi.js                 # get / post / put / patch / delete helpers
│   ├── DummyJsonUsersApi.js       # /users endpoints
│   ├── DummyJsonCartsApi.js       # /carts endpoints (all HTTP verbs)
│   ├── schemas.js                 # Response shape validators
│   └── index.js
├── tests/                   # Test specs
│   ├── login.spec.js              # Scenario 1 & 4 (valid / invalid login)
│   ├── cart.spec.js               # Scenario 2 (add to cart)
│   ├── checkout.spec.js           # Scenario 3 (checkout flow)
│   ├── api-ui-validation.spec.js  # Bonus (API + UI cross-check)
│   ├── api-carts.spec.js          # API-only: GET/POST/PUT/PATCH/DELETE contract
│   └── user-bugs.spec.js          # Known-bug matrix for all 6 users
├── test-data/               # JSON test data (no logic)
│   ├── users.json
│   ├── products.json
│   └── checkout.json
├── utils/                   # Reusable helpers + Playwright fixtures
│   ├── helpers.js                 # loginAs*, testData bundle, envOrDefault
│   └── fixtures.js                # test.extend adds dummyJsonUsers / dummyJsonCarts
├── postman/                 # Postman collections (DummyJSON, Qase)
├── playwright.config.js     # Playwright + reporters + baseURL config
├── Jenkinsfile              # Jenkins declarative pipeline
├── .env                     # Local secrets (gitignored)
├── .env.example             # Template for .env
├── README.md
└── package.json
```

### Reports & artefacts

- **HTML report:** `playwright-report/index.html` -- open with `npx playwright show-report`.
- **JUnit XML:** `test-results/junit.xml` -- consumed by CI.
- **Traces / videos / screenshots:** `test-results/` -- kept only for failing tests.

### Qase.io integration

Already wired end-to-end. `.env` holds the API token and the project code
(`SAUCEPW`). Set `QASE_MODE=testops` to publish results; leave it `off` to
run purely locally.

### CI/CD

- **GitHub Actions** (`.github/workflows/playwright.yml`) runs on push /
  pull request / manual trigger. Job installs Node 20, dependencies, and
  Chromium, then runs `npm run test:ci` (excludes known bugs) and uploads
  `playwright-report/` + `test-results/` as artefacts.
- **Jenkins** (`Jenkinsfile`) has parity with the GitHub workflow: install,
  browsers, tests, publish JUnit + HTML.

### License

MIT
