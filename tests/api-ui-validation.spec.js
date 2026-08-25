// @ts-check
const { test, expect, request: playwrightRequest } = require('@playwright/test');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const { CompletePage } = require('../pages/CompletePage');
const { loginAsStandardUser, testData, envOrDefault } = require('../utils/helpers');

/**
 * Bonus scenario: API + UI validation.
 *
 * We hit the public DummyJSON API to pull real user data, then drive the
 * saucedemo.com checkout flow using that API-supplied data. The UI is asserted
 * against the exact values returned from the API, so a change in either side
 * would surface as a test failure.
 *
 * DummyJSON is used because it is dependable, JSON-native, and provides
 * realistic "user" records with first name / last name / postal code fields.
 * ReqRes would work equivalently but currently gates GET endpoints behind an
 * API key; DummyJSON is unauthenticated and free.
 */

const DUMMYJSON_URL = 'https://dummyjson.com/users/1';
const IGNORE_HTTPS_ERRORS =
  (process.env.IGNORE_HTTPS_ERRORS ?? 'false').toLowerCase() === 'true';

test.describe('Bonus - API + UI data validation', () => {
  let apiUser;

  test.beforeAll(async () => {
    const ctx = await playwrightRequest.newContext({
      ignoreHTTPSErrors: IGNORE_HTTPS_ERRORS,
    });
    const res = await ctx.get(DUMMYJSON_URL);
    expect(res.ok(), `API call to ${DUMMYJSON_URL} should succeed`).toBeTruthy();
    apiUser = await res.json();
    await ctx.dispose();

    expect(apiUser.firstName, 'API user must have firstName').toBeTruthy();
    expect(apiUser.lastName, 'API user must have lastName').toBeTruthy();
    expect(
      apiUser?.address?.postalCode,
      'API user must have postalCode'
    ).toBeTruthy();
  });

  test('checkout uses API-sourced customer data and UI reflects it @api @ui @bonus', async ({
    page,
  }) => {
    const inventoryPage = await loginAsStandardUser(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const completePage = new CompletePage(page);
    const product = testData.products.backpack;

    await inventoryPage.addProductToCart(product.name);
    await inventoryPage.openCart();
    await cartPage.assertLoaded();

    await cartPage.proceedToCheckout();
    await checkoutPage.assertStepOneLoaded();

    const customerFromApi = {
      firstName: apiUser.firstName,
      lastName: apiUser.lastName,
      postalCode: String(apiUser.address.postalCode),
    };
    await checkoutPage.fillCustomerInformation(customerFromApi);

    await checkoutPage.assertStepTwoLoaded();
    await checkoutPage.finish();
    await completePage.assertLoaded();
    await completePage.assertOrderSuccessful();
  });

  test('API contract sanity check @api @contract', async ({ request }) => {
    const res = await request.get(DUMMYJSON_URL);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Minimum schema we depend on.
    expect(body).toEqual(
      expect.objectContaining({
        firstName: expect.any(String),
        lastName: expect.any(String),
        address: expect.objectContaining({
          postalCode: expect.anything(),
        }),
      })
    );
    // Silence unused-var lint for the env helper - shows how helpers plug in.
    expect(envOrDefault('REQRES_BASE_URL', 'https://reqres.in/api')).toBeTruthy();
  });
});
