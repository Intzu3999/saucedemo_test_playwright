// @ts-check
const { test, expect } = require('@playwright/test');
const { CartPage } = require('../pages/CartPage');
const { loginAsStandardUser, testData } = require('../utils/helpers');

test.describe('Scenario 2 - Add a product to cart', () => {
  test('adding a product updates the cart contents @cart @smoke', async ({
    page,
  }) => {
    const inventoryPage = await loginAsStandardUser(page);
    const cartPage = new CartPage(page);
    const product = testData.products.backpack;

    await inventoryPage.addProductToCart(product.name);
    expect(await inventoryPage.getCartCount()).toBe(1);

    await inventoryPage.openCart();
    await cartPage.assertLoaded();
    expect(await cartPage.getItemCount()).toBe(1);
    await cartPage.assertProductInCart(product.name);
  });

  test('multiple products all appear in the cart @cart', async ({ page }) => {
    const inventoryPage = await loginAsStandardUser(page);
    const cartPage = new CartPage(page);
    const productsToAdd = [
      testData.products.backpack.name,
      testData.products.bikeLight.name,
    ];

    for (const name of productsToAdd) {
      await inventoryPage.addProductToCart(name);
    }
    expect(await inventoryPage.getCartCount()).toBe(productsToAdd.length);

    await inventoryPage.openCart();
    await cartPage.assertLoaded();
    const cartNames = await cartPage.getItemNames();
    for (const name of productsToAdd) {
      expect(cartNames).toContain(name);
    }
  });
});
