// @ts-check
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * CheckoutPage - handles the two-step checkout flow:
 *   1) Your Information (step one)
 *   2) Overview (step two, review + finish)
 */
class CheckoutPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.title = page.locator('.title');
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorMessage = page.locator('[data-test="error"]');

    this.summaryItems = page.locator('.cart_item');
    this.summarySubtotal = page.locator('.summary_subtotal_label');
    this.summaryTotal = page.locator('.summary_total_label');
  }

  async assertStepOneLoaded() {
    await expect(this.page).toHaveURL(/.*checkout-step-one\.html/);
    await expect(this.title).toHaveText('Checkout: Your Information');
  }

  async assertStepTwoLoaded() {
    await expect(this.page).toHaveURL(/.*checkout-step-two\.html/);
    await expect(this.title).toHaveText('Checkout: Overview');
  }

  /**
   * @param {{ firstName: string, lastName: string, postalCode: string }} info
   */
  async fillCustomerInformation({ firstName, lastName, postalCode }) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
    await this.continueButton.click();
  }

  async finish() {
    await this.finishButton.click();
  }
}

module.exports = { CheckoutPage };
