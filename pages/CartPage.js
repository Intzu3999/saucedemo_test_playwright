// @ts-check
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * CartPage - the shopping cart review screen.
 */
class CartPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.title = page.locator('.title');
    this.cartItems = page.locator('.cart_item');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  async assertLoaded() {
    await expect(this.page).toHaveURL(/.*cart\.html/);
    await expect(this.title).toHaveText('Your Cart');
  }

  async getItemCount() {
    return this.cartItems.count();
  }

  async getItemNames() {
    return this.cartItems.locator('.inventory_item_name').allTextContents();
  }

  /**
   * @param {string} productName
   */
  async assertProductInCart(productName) {
    const names = await this.getItemNames();
    expect(names, `Cart should contain "${productName}"`).toContain(productName);
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}

module.exports = { CartPage };
