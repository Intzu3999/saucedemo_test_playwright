# Playwright Demo - saucedemo.com Automation Framework

A maintainable UI automation framework built with [Playwright](https://playwright.dev)
using the Page Object Model pattern, targeting
[https://www.saucedemo.com](https://www.saucedemo.com).

Includes:

- Four required end-to-end scenarios (login, cart, checkout, invalid login).
- Bonus API + UI validation scenario using the public DummyJSON API.
- Parameterised regression suite covering all six saucedemo users and their
  distinct UI/performance bugs.
- HTML, JUnit, and [Qase.IO](https://qase.io) reporters.
- GitHub Actions workflow and a Jenkins declarative pipeline.
- Screenshots, videos, and traces retained on failure.

---

## Table of Contents

1. [Framework overview](#framework-overview)
2. [Setup](#setup)
3. [Running tests](#running-tests)
4. [Folder structure](#folder-structure)
5. [Assumptions](#assumptions)

---

## Framework overview

- **Language / runtime:** JavaScript on Node.js 20+.
- **Test runner:** `@playwright/test`.
- **Design pattern:** Page Object Model. Each screen has its own class under
  `pages/`, extending a shared `BasePage`. Locators live inside the page
  objects; specs only call semantic methods (`login`, `addProductToCart`,
  `finish`, etc.).
- **Test data:** Externalised in `test-data/*.json` and consumed via
  `utils/helpers.js` so specs remain declarative and data-driven.
- **Configuration:** Environment-driven through `dotenv`. All tunables (base
  URL, credentials, retries, headless mode, Qase settings) live in `.env`.
- **Reporting:** Playwright HTML report + JUnit + optional Qase.IO cloud
  reporting when `QASE_MODE=testops`.
- **Failure diagnostics:** Screenshots (`only-on-failure`), videos and traces
  (`retain-on-failure`), plus artefacts uploaded by the CI pipeline.
- **CI/CD:** GitHub Actions workflow (`.github/workflows/playwright.yml`) and
  a Jenkins declarative pipeline (`Jenkinsfile`) are both pre-wired.

---

## Setup

Requires **Node.js 20 or newer** and **npm**.

```bash
git clone git@github.com:Intzu3999/playwright_demo.git
cd playwright_demo

npm ci
npx playwright install --with-deps chromium

cp .env.example .env
```

`.env` is gitignored -- adjust it for your machine. `.env.example` is the
committed template with sensible defaults.

---

## Running tests

```bash
# Run every test in headless mode (default configuration)
npx playwright test

# Convenience scripts
npm test               # same as npx playwright test
npm run test:headed    # run with a visible browser
npm run test:ui        # Playwright's interactive UI mode
npm run test:chromium  # explicit chromium-only run
npm run test:qase      # enable Qase.IO reporter (requires token in .env)
npm run report         # open the last HTML report
```

Filter by tag:

```bash
npx playwright test --grep "@smoke"
npx playwright test --grep "@checkout"
npx playwright test --grep "@bonus"
```

Reports are written to:

- `playwright-report/index.html` -- open with `npm run report`.
- `test-results/junit.xml` -- consumed by Jenkins and other CI tools.
- `test-results/` -- traces, videos, and screenshots for failing tests.

---

## Folder structure

```
playwright_demo/
├── .github/workflows/       # GitHub Actions CI workflow
│   └── playwright.yml
├── pages/                   # Page Object Models
│   ├── BasePage.js
│   ├── LoginPage.js
│   ├── InventoryPage.js
│   ├── CartPage.js
│   ├── CheckoutPage.js
│   └── CompletePage.js
├── tests/                   # Test specs
│   ├── login.spec.js              # Scenario 1 & 4 (valid / invalid login)
│   ├── cart.spec.js               # Scenario 2 (add to cart)
│   ├── checkout.spec.js           # Scenario 3 (checkout flow)
│   ├── api-ui-validation.spec.js  # Bonus (API + UI cross-check)
│   └── user-bugs.spec.js          # Parameterised bug matrix for all 6 users
├── test-data/               # JSON test data (no logic)
│   ├── users.json
│   ├── products.json
│   └── checkout.json
├── utils/                   # Reusable helpers (login, data access)
│   └── helpers.js
├── docs/                    # Living documentation (gitignored, local only)
│   ├── plan.md                    # Prioritised delivery plan
│   ├── test-plan-saucedemo.md     # Simple test plan matrix
│   ├── test-data-flow.md          # How data flows through the tests
│   └── why-json-for-test-data.md  # Rationale for JSON test data
├── postman/                 # Postman collections (DummyJSON, Qase)
│   ├── DummyJSON-Carts.postman_collection.json
│   ├── Qase-TestCases.postman_collection.json
│   └── README.md
├── playwright.config.js     # Playwright + reporters + baseURL config
├── Jenkinsfile              # Jenkins declarative pipeline
├── .env                     # Local secrets (gitignored)
├── .env.example             # Template for .env
├── README.md
└── package.json
```

---

## Assumptions

- The test target `https://www.saucedemo.com` remains publicly reachable and
  its credentials (`standard_user`, `locked_out_user`, etc.) are stable, as
  documented on the site's login page.
- The default password (`secret_sauce`) is public demo data and safe to check
  into the `.env.example` template.
- Chromium alone is sufficient for the assignment; Firefox / WebKit projects
  are commented out in `playwright.config.js` and can be re-enabled after
  running `npx playwright install firefox webkit`.
- One retry locally, two in CI, mirrors real-world flake handling without
  hiding legitimate failures.
- The bonus scenario uses DummyJSON instead of ReqRes because ReqRes now
  gates its public GET endpoints behind an API key; DummyJSON exposes the
  same shape of user data without authentication.
- Known SauceDemo product bugs (`problem_user`, `performance_glitch_user`,
  `error_user`, `visual_user`) are treated as **expected failures** using
  Playwright's `test.fail()`. Playwright shows the run as green; Qase.IO
  reports them as `failed` because Qase has no native "expected failure"
  concept -- this is deliberate so the Qase dashboard still surfaces real
  product bugs.
- Qase.IO project code in `.env.example` is a placeholder -- override via
  `.env` locally or CI secrets/variables when running against a real Qase
  project.

---

## License

MIT
