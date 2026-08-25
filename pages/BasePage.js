// @ts-check

/**
 * BasePage - Common functionality shared across all page objects.
 * Every concrete page object should extend this class.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a URL relative to the configured baseURL.
   * @param {string} path
   */
  async goto(path = '/') {
    await this.page.goto(path);
  }

  /**
   * Return the current page URL.
   */
  async currentUrl() {
    return this.page.url();
  }

  /**
   * Return the title of the currently open page.
   */
  async title() {
    return this.page.title();
  }
}

module.exports = { BasePage };
