// @ts-check
const { test, expect } = require('@playwright/test');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const { CompletePage } = require('../pages/CompletePage');
const { loginAsStandardUser, testData } = require('../utils/helpers');

test.describe('Checkout -- happy path + validation', () => {
  test('user can checkout successfully and see confirmation @checkout @smoke @e2e', async ({
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
    await cartPage.assertProductInCart(product.name);

    await cartPage.proceedToCheckout();
    await checkoutPage.assertStepOneLoaded();
    await checkoutPage.fillCustomerInformation(testData.checkout.validCustomer);

    await checkoutPage.assertStepTwoLoaded();
    await expect(checkoutPage.summaryItems).toHaveCount(1);

    await checkoutPage.finish();
    await completePage.assertLoaded();
    await completePage.assertOrderSuccessful();
  });

  test('missing first name blocks checkout progression @checkout @negative', async ({
    page,
  }) => {
    const inventoryPage = await loginAsStandardUser(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await inventoryPage.addProductToCart(testData.products.backpack.name);
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();

    await checkoutPage.assertStepOneLoaded();
    await checkoutPage.fillCustomerInformation({
      firstName: '',
      lastName: 'Keoy',
      postalCode: '50000',
    });

    await expect(checkoutPage.errorMessage).toBeVisible();
    await expect(checkoutPage.errorMessage).toHaveText(/First Name is required/i);
  });
});
