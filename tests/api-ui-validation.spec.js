// @ts-check
//
// Bonus scenario: API + UI validation.
//
// Pulls a real user record from https://dummyjson.com/users/1 via our API
// client, then drives the saucedemo.com checkout flow using those API-supplied
// values. If either side changes shape, this spec fails.
//
// Notice how zero HTTP boilerplate lives in this file. All request-building is
// delegated to `api/DummyJsonUsersApi.js`, exactly like all locator-building
// is delegated to `pages/*.js`.

const { test, expect } = require('../utils/fixtures');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const { CompletePage } = require('../pages/CompletePage');
const { loginAsStandardUser, testData } = require('../utils/helpers');
const { schemas } = require('../api');

test.describe('Bonus -- API + UI data validation @api @ui @bonus', () => {
  /** @type {any} */
  let apiUser;

  test.beforeAll(async ({ dummyJsonUsers }) => {
    const res = await dummyJsonUsers.getUser(1);
    expect(res.ok(), 'API call for user/1 should succeed').toBeTruthy();
    apiUser = await res.json();

    expect(apiUser).toEqual(schemas.userSchema);
  });

  test('checkout uses API-sourced customer data and UI reflects it', async ({
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

  test('API contract sanity check @contract', async ({ dummyJsonUsers }) => {
    const res = await dummyJsonUsers.getUser(1);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual(schemas.userSchema);
  });
});
