// @ts-check
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * CompletePage - the checkout confirmation screen.
 */
class CompletePage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.title = page.locator('.title');
    this.completeHeader = page.locator('.complete-header');
    this.completeText = page.locator('.complete-text');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  async assertLoaded() {
    await expect(this.page).toHaveURL(/.*checkout-complete\.html/);
    await expect(this.title).toHaveText('Checkout: Complete!');
  }

  async assertOrderSuccessful() {
    await expect(this.completeHeader).toBeVisible();
    await expect(this.completeHeader).toHaveText(/Thank you for your order/i);
    await expect(this.backHomeButton).toBeVisible();
  }

  async backToProducts() {
    await this.backHomeButton.click();
  }
}

module.exports = { CompletePage };
