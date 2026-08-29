// @ts-check
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const { testData } = require('../utils/helpers');

test.describe('Login -- valid credentials', () => {
  test('valid user lands on the inventory page @login @smoke', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.open();
    await loginPage.login(
      testData.users.standard.username,
      testData.users.standard.password
    );

    await inventoryPage.assertLoaded();
    expect(await inventoryPage.getProductCount()).toBeGreaterThan(0);
  });
});

test.describe('Login -- invalid credentials', () => {
  test('invalid user sees the expected error message @login @negative', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(
      testData.users.invalid.username,
      testData.users.invalid.password
    );

    expect(await loginPage.isErrorVisible()).toBeTruthy();
    const errorText = await loginPage.getErrorText();
    expect(errorText).toBe(testData.users.invalid.expectedError);
    await expect(page).not.toHaveURL(/.*inventory\.html/);
  });

  test('locked-out user sees the locked-out error @login @negative', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(
      testData.users.lockedOut.username,
      testData.users.lockedOut.password
    );

    const errorText = await loginPage.getErrorText();
    expect(errorText).toBe(testData.users.lockedOutError);
  });
});
