# Test-case inventory

The complete list of tests in this repo, with descriptions and current
pass/fail expectations. This is the source of truth for the compact
"What's tested" table in the [main README](../README.md#3-whats-tested),
which also carries the full per-test tables in
[section 4](../README.md#4-test-case-inventory-all-39-tests).

Verified against `npx playwright test --list` on Aug 29, 2026.

---

## Summary counts

| Bucket | Count |
|---|---|
| Total tests | **39** |
| `@known-bug` tests | 11 (10 fail today + 1 currently passes) |
| Non-`@known-bug` tests | 28 |
| Currently passing | **29** (28 non-bug + 1 known-bug that meets SLA today) |
| Currently failing | **10** (all `@known-bug` -- real SauceDemo defects) |

---

## The "Scenario 1-4" numbering explained

You will see `Login -- valid credentials`, `Cart -- add product`, etc. in the
spec files. These four describes cover the **four required scenarios from
the assignment prompt**:

| Assignment prompt | Where in code |
|---|---|
| Scenario 1 -- valid login | `tests/login.spec.js` -- describe `Login -- valid credentials` |
| Scenario 2 -- add to cart | `tests/cart.spec.js` -- describe `Cart -- add product` |
| Scenario 3 -- complete checkout | `tests/checkout.spec.js` -- describe `Checkout -- happy path + validation` |
| Scenario 4 -- invalid login | `tests/login.spec.js` -- describe `Login -- invalid credentials` |

Scenarios 1 and 4 are both about login, so they share one spec file with two
describe blocks. Everything else in this repo (API layer, 6-user login
matrix, known-bug regression) is beyond the required 4.

The `Scenario N -` prefix was previously embedded in the describe names but
was dropped: numbers drift when tests are added or reordered, and the
mapping is documented here instead.

---

## Tags in use

Three groups, listed by purpose. Counts are of tests where `--grep "@tag"`
would match (so a describe-level tag counts for every test inside it).

### Filter tags -- the ones you'd actually pass to `--grep`

| Tag | Matches | Purpose |
|---|---|---|
| `@known-bug` | 11 | Excluded from CI. Test asserts against a real SauceDemo defect. |
| `@smoke` | 4 | Fastest sanity subset. Used by `npm run test:smoke`. |
| `@negative` | 6 | Any error/failure-path test. |
| `@parametrized` | 6 | Data-driven tests (currently: the 6-user login matrix). |
| `@bonus` | 2 | The API + UI cross-check scenario from the assignment. |
| `@contract` | 1 | API shape / contract sanity check. |
| `@e2e` | 1 | Full end-to-end checkout. |

### Feature-group tags -- roughly one per file, useful for scoping a run

| Tag | Matches | Where |
|---|---|---|
| `@login` | 9 | `login.spec.js` (3) + 6-user login matrix (6) |
| `@cart` | 2 | `cart.spec.js` |
| `@checkout` | 2 | `checkout.spec.js` |
| `@ui` | 2 | `api-ui-validation.spec.js` (paired with `@bonus`) |
| `@api` | 12 | `api-carts.spec.js` (10) + `api-ui-validation.spec.js` (2) |
| `@carts` | 10 | `api-carts.spec.js` only |

### Bug-owner tags -- group known-bug tests by which SauceDemo user exposes them

| Tag | Matches | Notes |
|---|---|---|
| `@bug` | 14 | Union of the four below |
| `@problem_user` | 9 | 6 pass + 3 fail (add-to-cart matrix + 3 other bugs) |
| `@performance_glitch_user` | 2 | 1 pass + 1 fail (SLA-based) |
| `@error_user` | 2 | Both fail |
| `@visual_user` | 1 | Fails |

> Playwright's `--grep` matches against the **full test title** =
> `describe` + test name + all tags. A test under
> `describe('problem_user bugs @problem_user @bug', ...)` matches all of
> `--grep "@problem_user"`, `--grep "@bug"`, and (if the test itself is
> tagged) `--grep "@known-bug"`.

---

## Full inventory (39 tests)

Legend for **Result today**:

- **PASS** -- test asserts correct behaviour and SauceDemo behaves correctly.
- **FAIL (bug)** -- test asserts correct behaviour, SauceDemo has a defect.
- **PASS (@known-bug)** -- test is tagged `@known-bug` but currently passes
  (the bug is either not deterministic, or the SLA the test asserts is
  currently met, or SauceDemo silently fixed it).

### 1. `tests/login.spec.js` (3 tests) -- covers required Scenarios 1 & 4

| # | Test title (full) | What it tests | Tags | Result today |
|---|---|---|---|---|
| 1 | `Login -- valid credentials > valid user lands on the inventory page` | `standard_user` reaches `/inventory.html` and sees > 0 products | `@login @smoke` | PASS |
| 2 | `Login -- invalid credentials > invalid user sees the expected error message` | Wrong username/password shows the expected error banner and stays on login | `@login @negative` | PASS |
| 3 | `Login -- invalid credentials > locked-out user sees the locked-out error` | `locked_out_user` sees "Sorry, this user has been locked out." | `@login @negative` | PASS |

### 2. `tests/cart.spec.js` (2 tests) -- covers required Scenario 2

| # | Test title (full) | What it tests | Tags | Result today |
|---|---|---|---|---|
| 4 | `Cart -- add product > adding a product updates the cart contents` | Add Backpack; badge shows 1; cart page shows the product | `@cart @smoke` | PASS |
| 5 | `Cart -- add product > multiple products all appear in the cart` | Add Backpack + Bike Light; both appear on the cart page | `@cart` | PASS |

### 3. `tests/checkout.spec.js` (2 tests) -- covers required Scenario 3

| # | Test title (full) | What it tests | Tags | Result today |
|---|---|---|---|---|
| 6 | `Checkout -- happy path + validation > user can checkout successfully and see confirmation` | Full happy-path: add product -> step 1 -> step 2 -> finish -> success page | `@checkout @smoke @e2e` | PASS |
| 7 | `Checkout -- happy path + validation > missing first name blocks checkout progression` | Empty first-name surfaces "First Name is required" | `@checkout @negative` | PASS |

### 4. `tests/api-ui-validation.spec.js` (2 tests) -- Bonus (API + UI cross-check)

| # | Test title (full) | What it tests | Tags | Result today |
|---|---|---|---|---|
| 8 | `Bonus -- API + UI data validation > checkout uses API-sourced customer data and UI reflects it` | Fetch DummyJSON user/1, drive SauceDemo checkout with those values, expect success | `@api @ui @bonus` | PASS |
| 9 | `Bonus -- API + UI data validation > API contract sanity check @contract` | DummyJSON `/users/1` returns 200 with the expected user schema | `@api @ui @bonus @contract` | PASS |

### 5. `tests/api-carts.spec.js` (10 tests) -- API contract suite

| # | Test title (full) | What it tests | Tags | Result today |
|---|---|---|---|---|
| 10 | `DummyJSON /carts -- contract > GET /carts -- paginated list @smoke` | GET `/carts?limit=5&skip=0` returns paginated cart list matching the schema | `@api @carts @smoke` | PASS |
| 11 | `DummyJSON /carts -- contract > GET /carts/:id -- single cart shape` | GET `/carts/1` returns a single cart matching cartSchema, `id === 1` | `@api @carts` | PASS |
| 12 | `DummyJSON /carts -- contract > GET /carts/user/:userId -- carts by user` | GET `/carts/user/5` -- every returned cart's `userId === 5` | `@api @carts` | PASS |
| 13 | `DummyJSON /carts -- contract > POST /carts/add -- create cart returns computed totals` | POST a new cart; response has correct `totalProducts` and `totalQuantity` | `@api @carts` | PASS |
| 14 | `DummyJSON /carts -- contract > PUT /carts/:id -- update merges when merge=true` | PUT `/carts/1` with `merge: true` keeps existing products and adds the new one | `@api @carts` | PASS |
| 15 | `DummyJSON /carts -- contract > PATCH /carts/:id -- partial update replaces when merge=false` | PATCH `/carts/1` with `merge: false` replaces the product list entirely | `@api @carts` | PASS |
| 16 | `DummyJSON /carts -- contract > DELETE /carts/:id -- returns isDeleted flag` | DELETE `/carts/1` returns `isDeleted: true` + `deletedOn` timestamp | `@api @carts` | PASS |
| 17 | `DummyJSON /carts -- negative cases > GET /carts/:id -- unknown id returns 404` | GET `/carts/99999` -> 404 with a message field | `@api @carts @negative` | PASS |
| 18 | `DummyJSON /carts -- negative cases > GET /carts -- negative limit (records current behaviour)` | Records what DummyJSON returns for `limit=-1` (public sandbox is lenient) | `@api @carts @negative` | PASS |
| 19 | `DummyJSON /carts -- negative cases > GET /carts -- limit exceeds max (records current behaviour)` | Records what DummyJSON returns for `limit=10000` | `@api @carts @negative` | PASS |

### 6. `tests/user-bugs.spec.js` (20 tests)

#### 6a. Login-access matrix -- parametrized across 6 users (6 tests, all pass)

Every SauceDemo user should reach its expected outcome from the login page.

| # | Test title (full) | What it tests | Tags | Result today |
|---|---|---|---|---|
| 20 | `User access -- login matrix > login access -- standard_user` | Logs in, expects `/inventory.html` | `@login @parametrized` | PASS |
| 21 | `User access -- login matrix > login access -- locked_out_user` | Sees the locked-out error, stays on login | `@login @parametrized` | PASS |
| 22 | `User access -- login matrix > login access -- problem_user` | Logs in, expects `/inventory.html` | `@login @parametrized` | PASS |
| 23 | `User access -- login matrix > login access -- performance_glitch_user` | Logs in, expects `/inventory.html` | `@login @parametrized` | PASS |
| 24 | `User access -- login matrix > login access -- error_user` | Logs in, expects `/inventory.html` | `@login @parametrized` | PASS |
| 25 | `User access -- login matrix > login access -- visual_user` | Logs in, expects `/inventory.html` | `@login @parametrized` | PASS |

#### 6b. `problem_user` bugs (9 tests: 6 pass, 3 fail)

Includes the parametrized add-to-cart matrix. Automation revealed the
"random" bug is deterministic -- 3 specific products fail, 3 work.

| # | Test title (full) | What it tests | Tags | Result today |
|---|---|---|---|---|
| 26 | `problem_user bugs > every product image should have a unique src @known-bug` | All 6 product images should have distinct src URLs | `@problem_user @bug @known-bug` | **FAIL (bug)** -- all 6 images are the same placeholder |
| 27 | `problem_user bugs > can add "Sauce Labs Backpack" to cart` | Add Backpack; badge = 1 | `@problem_user @bug` | PASS |
| 28 | `problem_user bugs > can add "Sauce Labs Bike Light" to cart` | Add Bike Light; badge = 1 | `@problem_user @bug` | PASS |
| 29 | `problem_user bugs > can add "Sauce Labs Bolt T-Shirt" to cart @known-bug` | Add Bolt T-Shirt; badge = 1 | `@problem_user @bug @known-bug` | **FAIL (bug)** -- click swallowed |
| 30 | `problem_user bugs > can add "Sauce Labs Fleece Jacket" to cart @known-bug` | Add Fleece Jacket; badge = 1 | `@problem_user @bug @known-bug` | **FAIL (bug)** -- click swallowed |
| 31 | `problem_user bugs > can add "Sauce Labs Onesie" to cart` | Add Onesie; badge = 1 | `@problem_user @bug` | PASS |
| 32 | `problem_user bugs > can add "Test.allTheThings() T-Shirt (Red)" to cart @known-bug` | Add Red T-Shirt; badge = 1 | `@problem_user @bug @known-bug` | **FAIL (bug)** -- click swallowed |
| 33 | `problem_user bugs > can remove product after adding @known-bug` | Add then Remove; badge = 0 | `@problem_user @bug @known-bug` | **FAIL (bug)** -- Remove button is a no-op |
| 34 | `problem_user bugs > checkout last-name field accepts input independently of first-name @known-bug` | Typing into Last Name shouldn't leak into First Name | `@problem_user @bug @known-bug` | **FAIL (bug)** -- keystrokes cross fields |

#### 6c. `performance_glitch_user` bugs (2 tests: 1 pass @known-bug, 1 fail)

| # | Test title (full) | What it tests | Tags | Result today |
|---|---|---|---|---|
| 35 | `performance_glitch_user bugs > login redirect completes within SLA @known-bug` | Login -> `/inventory.html` in < 3000 ms | `@performance_glitch_user @bug @known-bug` | **FAIL (bug)** -- takes 5+ seconds |
| 36 | `performance_glitch_user bugs > add-to-cart click reflects on the cart badge within SLA @known-bug` | Click Add-to-Cart, badge updates in < 3000 ms | `@performance_glitch_user @bug @known-bug` | **PASS (@known-bug)** -- SLA met today. Automation finding: SauceDemo's delay is action-specific, not global. |

#### 6d. `error_user` bugs (2 tests, both fail)

| # | Test title (full) | What it tests | Tags | Result today |
|---|---|---|---|---|
| 37 | `error_user bugs > checkout last-name field is responsive @known-bug` | Last-Name input should accept typed characters | `@error_user @bug @known-bug` | **FAIL (bug)** -- field ignores keyboard input |
| 38 | `error_user bugs > submitting checkout with empty last name shows an inline error @known-bug` | Continue with empty Last Name should show the required-field error | `@error_user @bug @known-bug` | **FAIL (bug)** -- clicking Continue silently navigates back |

#### 6e. `visual_user` bugs (1 test, fails)

| # | Test title (full) | What it tests | Tags | Result today |
|---|---|---|---|---|
| 39 | `visual_user bugs > 6th product Add-to-Cart button stays inside its card @known-bug` | 6th card's Add-to-Cart button should not overflow its parent card boundary | `@visual_user @bug @known-bug` | **FAIL (bug)** -- button overflows the card |

---

## Traceability to README §3 "What's tested"

| README bucket | Tests in this doc |
|---|---|
| Required scenarios (assignment 1-4) | 1, 2, 3, 4, 5, 6, 7 |
| API layer | 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 |
| Login access matrix (6 users) | 20, 21, 22, 23, 24, 25 |
| Known-bug regression (5 buggy users) | 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39 (14 tests, 4 pass + 10 fail) |
| **Total** | **39 (29 pass + 10 fail)** |
