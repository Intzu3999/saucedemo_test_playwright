// @ts-check
//
// User-bug regression spec for saucedemo.com.
//
// SauceDemo intentionally ships six user accounts, each with a distinct
// front-end bug baked into the site's JavaScript (per-username `if` branches
// in the source). Every test in this file asserts the CORRECT / non-buggy
// behaviour.
//
// Reporting model:
//   * Tests that today are expected to fail because SauceDemo has NOT fixed
//     the bug carry the tag `@known-bug` in their title.
//   * We do NOT use Playwright's `test.fail()` marker any more -- that made
//     the Playwright report show them as GREEN (expected failure) while Qase
//     showed them as RED (failed). Confusing and inconsistent.
//   * Now: bug present  = RED in both Playwright report and Qase.
//          bug fixed    = GREEN in both. When that happens, drop the
//                         `@known-bug` tag so CI starts protecting the fix.
//
// Run modes (see package.json):
//   npm test               -> runs everything. Expect ~10 red @known-bug tests.
//   npm run test:ci        -> excludes @known-bug. Suite should be GREEN.
//   npm run test:known-bugs-> ONLY @known-bug. Expect them all to fail today.
//
// See docs/test-plan-saucedemo.md for the human-readable matrix.

const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const { testData, loginAsUser } = require('../utils/helpers');

/**
 * Attach a machine-readable "known-bug" annotation to the current test so
 * the reason for failure is visible in Playwright's HTML report and Qase
 * attachments. Does NOT change pass/fail semantics.
 * @param {string} description
 */
function annotateKnownBug(description) {
  test.info().annotations.push({ type: 'known-bug', description });
}

// ---------------------------------------------------------------------------
// Section 1 -- Login access matrix (parameterized over all 6 users)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} LoginRow
 * @property {string} username
 * @property {string} password
 * @property {boolean} expectLoginSuccess
 * @property {string} [expectedError]
 */

/** @type {LoginRow[]} */
const USER_ACCESS_MATRIX = [
  {
    username: testData.users.standard.username,
    password: testData.users.standard.password,
    expectLoginSuccess: true,
  },
  {
    username: testData.users.lockedOut.username,
    password: testData.users.lockedOut.password,
    expectLoginSuccess: false,
    expectedError: testData.users.lockedOutError,
  },
  {
    username: testData.users.problem.username,
    password: testData.users.problem.password,
    expectLoginSuccess: true,
  },
  {
    username: testData.users.performanceGlitch.username,
    password: testData.users.performanceGlitch.password,
    expectLoginSuccess: true,
  },
  {
    username: testData.users.error.username,
    password: testData.users.error.password,
    expectLoginSuccess: true,
  },
  {
    username: testData.users.visual.username,
    password: testData.users.visual.password,
    expectLoginSuccess: true,
  },
];

test.describe('User access -- login matrix @login @parametrized', () => {
  for (const row of USER_ACCESS_MATRIX) {
    test(`login access -- ${row.username}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.open();
      await loginPage.login(row.username, row.password);

      if (row.expectLoginSuccess) {
        await expect(page).toHaveURL(/.*inventory\.html/);
      } else {
        expect(await loginPage.getErrorText()).toBe(row.expectedError);
        await expect(page).not.toHaveURL(/.*inventory\.html/);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Section 2 -- problem_user bugs
// ---------------------------------------------------------------------------

test.describe('problem_user bugs @problem_user @bug', () => {
  test('every product image should have a unique src @known-bug', async ({
    page,
  }) => {
    annotateKnownBug(
      'problem_user renders the same placeholder image for all 6 products.'
    );
    const inventoryPage = await loginAsUser(
      page,
      testData.users.problem.username,
      testData.users.problem.password
    );

    const imageSrcs = await inventoryPage.getProductImageSrcs();
    const uniqueSrcs = new Set(imageSrcs);

    expect(imageSrcs).toHaveLength(6);
    expect(
      uniqueSrcs.size,
      'Expected 6 distinct product image URLs, but some products share the same image'
    ).toBe(6);
  });

  // Parameterized: try to add each of the 6 products in isolation.
  //
  // Automated runs reveal the "random" behaviour is actually deterministic:
  //   * products 1 (Backpack), 2 (Bike Light), 5 (Onesie) -- ADD works
  //   * products 3 (Bolt T-Shirt), 4 (Fleece Jacket), 6 (Red T-Shirt) -- ADD is
  //     wired incorrectly and does not increment the cart badge.
  // The buggy list is data-driven from test-data/products.json so the spec
  // itself doesn't need editing when the observation changes.
  for (const productName of testData.products.list) {
    const isKnownBrokenForProblemUser =
      testData.products.problemUserBugs.cannotAddToCart.includes(productName);
    const tag = isKnownBrokenForProblemUser ? ' @known-bug' : '';

    test(`can add "${productName}" to cart${tag}`, async ({ page }) => {
      if (isKnownBrokenForProblemUser) {
        annotateKnownBug(
          `problem_user cannot add "${productName}" -- Add-to-Cart click has no effect.`
        );
      }

      const inventoryPage = await loginAsUser(
        page,
        testData.users.problem.username,
        testData.users.problem.password
      );

      await inventoryPage.addProductToCart(productName);
      expect(await inventoryPage.getCartCount()).toBe(1);
    });
  }

  test('can remove product after adding @known-bug', async ({ page }) => {
    annotateKnownBug(
      'For problem_user the Remove button on a product card does nothing -- the item stays in the cart.'
    );
    const inventoryPage = await loginAsUser(
      page,
      testData.users.problem.username,
      testData.users.problem.password
    );

    await inventoryPage.addProductToCart(testData.products.backpack.name);
    expect(await inventoryPage.getCartCount()).toBe(1);

    await inventoryPage.removeProductFromCart(testData.products.backpack.name);
    expect(
      await inventoryPage.getCartCount(),
      'Cart should be empty after removing the only item'
    ).toBe(0);
  });

  test('checkout last-name field accepts input independently of first-name @known-bug', async ({
    page,
  }) => {
    annotateKnownBug(
      'For problem_user, characters typed into the Last Name field are routed into the First Name field one character at a time.'
    );
    const inventoryPage = await loginAsUser(
      page,
      testData.users.problem.username,
      testData.users.problem.password
    );
    const checkoutPage = new CheckoutPage(page);

    await inventoryPage.addProductToCart(testData.products.backpack.name);
    await inventoryPage.openCart();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await checkoutPage.assertStepOneLoaded();

    await checkoutPage.firstNameInput.fill('TestFirst');
    await checkoutPage.lastNameInput.pressSequentially('TestLast', { delay: 20 });

    await expect(
      checkoutPage.firstNameInput,
      'First-name field should retain "TestFirst" -- last-name typing should not leak into it'
    ).toHaveValue('TestFirst');
    await expect(
      checkoutPage.lastNameInput,
      'Last-name field should contain "TestLast"'
    ).toHaveValue('TestLast');
  });
});

// ---------------------------------------------------------------------------
// Section 3 -- performance_glitch_user
// ---------------------------------------------------------------------------

test.describe('performance_glitch_user bugs @performance_glitch_user @bug', () => {
  // Prompt-test-scenarios.md: "lags, delays, several seconds on every move,
  // text inputs, and button clicks." We assert the SLA on two representative
  // actions -- login redirect and Add-to-Cart -- so a fix (or a further
  // regression) is caught even if only one path is instrumented.
  const LATENCY_SLA_MS = 3000;

  test('login redirect completes within SLA @known-bug', async ({ page }) => {
    annotateKnownBug(
      `performance_glitch_user has intentional delays. SLA: < ${LATENCY_SLA_MS}ms.`
    );

    const loginPage = new LoginPage(page);
    await loginPage.open();

    const start = Date.now();
    await loginPage.login(
      testData.users.performanceGlitch.username,
      testData.users.performanceGlitch.password
    );
    await page.waitForURL(/.*inventory\.html/, { timeout: 15_000 });
    const elapsedMs = Date.now() - start;

    expect(
      elapsedMs,
      `Login redirect took ${elapsedMs}ms, expected < ${LATENCY_SLA_MS}ms`
    ).toBeLessThan(LATENCY_SLA_MS);
  });

  test('add-to-cart click reflects on the cart badge within SLA @known-bug', async ({
    page,
  }) => {
    annotateKnownBug(
      `performance_glitch_user has intentional per-click delays on inventory actions too, not just on login redirect. SLA: < ${LATENCY_SLA_MS}ms.`
    );
    const inventoryPage = await loginAsUser(
      page,
      testData.users.performanceGlitch.username,
      testData.users.performanceGlitch.password
    );

    const start = Date.now();
    await inventoryPage.addProductToCart(testData.products.backpack.name);
    await expect(inventoryPage.cartBadge).toHaveText('1', {
      timeout: LATENCY_SLA_MS,
    });
    const elapsedMs = Date.now() - start;

    expect(
      elapsedMs,
      `Add-to-cart -> badge update took ${elapsedMs}ms, expected < ${LATENCY_SLA_MS}ms`
    ).toBeLessThan(LATENCY_SLA_MS);
  });
});

// ---------------------------------------------------------------------------
// Section 4 -- error_user bugs
// ---------------------------------------------------------------------------

test.describe('error_user bugs @error_user @bug', () => {
  test('checkout last-name field is responsive @known-bug', async ({ page }) => {
    annotateKnownBug(
      'For error_user, the Last Name field on checkout step 1 does not accept keyboard input.'
    );
    const inventoryPage = await loginAsUser(
      page,
      testData.users.error.username,
      testData.users.error.password
    );
    const checkoutPage = new CheckoutPage(page);

    await inventoryPage.addProductToCart(testData.products.backpack.name);
    await inventoryPage.openCart();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await checkoutPage.assertStepOneLoaded();

    await checkoutPage.lastNameInput.fill('TestLast');
    await expect(checkoutPage.lastNameInput).toHaveValue('TestLast');
  });

  test('submitting checkout with empty last name shows an inline error @known-bug', async ({
    page,
  }) => {
    annotateKnownBug(
      'error_user does not see the required-field error; clicking Continue silently navigates back one page.'
    );
    const inventoryPage = await loginAsUser(
      page,
      testData.users.error.username,
      testData.users.error.password
    );
    const checkoutPage = new CheckoutPage(page);

    await inventoryPage.addProductToCart(testData.products.backpack.name);
    await inventoryPage.openCart();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await checkoutPage.assertStepOneLoaded();

    await checkoutPage.firstNameInput.fill('TestFirst');
    await checkoutPage.postalCodeInput.fill('12345');
    await checkoutPage.continueButton.click();

    await expect(checkoutPage.errorMessage).toBeVisible();
    expect(await checkoutPage.errorMessage.textContent()).toContain('Last Name');
  });
});

// ---------------------------------------------------------------------------
// Section 5 -- visual_user bugs
// ---------------------------------------------------------------------------

test.describe('visual_user bugs @visual_user @bug', () => {
  test('6th product Add-to-Cart button stays inside its card @known-bug', async ({
    page,
  }) => {
    annotateKnownBug(
      'For visual_user, the 6th product card renders its Add-to-Cart button outside the card boundary.'
    );
    const inventoryPage = await loginAsUser(
      page,
      testData.users.visual.username,
      testData.users.visual.password
    );

    const card = inventoryPage.cardContainer(6);
    const button = inventoryPage.addToCartButtonForCard(6);

    const cardBox = await card.boundingBox();
    const buttonBox = await button.boundingBox();

    expect(cardBox, 'Card 6 must have a bounding box').not.toBeNull();
    expect(buttonBox, 'Card 6 Add-to-Cart button must have a bounding box').not.toBeNull();

    if (!cardBox || !buttonBox) return;

    const buttonRight = buttonBox.x + buttonBox.width;
    const cardRight = cardBox.x + cardBox.width;

    expect(
      buttonRight,
      `Button right edge (${buttonRight}) must not exceed card right edge (${cardRight})`
    ).toBeLessThanOrEqual(cardRight + 1);
  });
});
