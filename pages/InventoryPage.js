// @ts-check
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * InventoryPage - the product listing after successful login.
 */
class InventoryPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.title = page.locator('.title');
    this.inventoryContainer = page.locator('[data-test="inventory-container"]');
    this.inventoryItems = page.locator('.inventory_item');
    this.cartLink = page.locator('.shopping_cart_link');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.burgerMenuButton = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
  }

  async assertLoaded() {
    await expect(this.page).toHaveURL(/.*inventory\.html/);
    await expect(this.title).toHaveText('Products');
    await expect(this.inventoryContainer).toBeVisible();
  }

  async getProductCount() {
    return this.inventoryItems.count();
  }

  /**
   * Adds the given product (by visible name) to the cart.
   * @param {string} productName
   */
  async addProductToCart(productName) {
    const item = this.inventoryItems.filter({ hasText: productName });
    await expect(item, `Product "${productName}" not found`).toBeVisible();
    await item.getByRole('button', { name: 'Add to cart' }).click();
  }

  /**
   * Removes the given product from the cart via the Remove button on its card.
   * @param {string} productName
   */
  async removeProductFromCart(productName) {
    const item = this.inventoryItems.filter({ hasText: productName });
    await expect(item, `Product "${productName}" not found`).toBeVisible();
    await item.getByRole('button', { name: 'Remove' }).click();
  }

  async getCartCount() {
    if (!(await this.cartBadge.isVisible())) return 0;
    return Number((await this.cartBadge.textContent())?.trim() ?? 0);
  }

  async openCart() {
    await this.cartLink.click();
  }

  /**
   * Returns the `src` attribute for every product image on the page,
   * in display order. Used by the problem_user visual-regression check
   * (all products should NOT share the same image).
   * @returns {Promise<string[]>}
   */
  async getProductImageSrcs() {
    return this.inventoryItems.locator('img.inventory_item_img').evaluateAll(
      (imgs) => imgs.map((img) => img.getAttribute('src') ?? '')
    );
  }

  /**
   * Returns the Add-to-Cart button locator for the Nth product card (1-indexed
   * to match human counting: card #1 is the first one shown).
   * @param {number} oneBasedIndex
   */
  addToCartButtonForCard(oneBasedIndex) {
    return this.inventoryItems
      .nth(oneBasedIndex - 1)
      .getByRole('button', { name: 'Add to cart' });
  }

  /**
   * Returns the bounding-box rectangle for the Nth product card. Used to check
   * whether the Add-to-Cart button overflows its parent for visual_user.
   * @param {number} oneBasedIndex
   */
  cardContainer(oneBasedIndex) {
    return this.inventoryItems.nth(oneBasedIndex - 1);
  }

  async logout() {
    await this.burgerMenuButton.click();
    await this.logoutLink.click();
  }
}

module.exports = { InventoryPage };
