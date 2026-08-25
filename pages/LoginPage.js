// @ts-check
const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');

/**
 * LoginPage - the saucedemo.com login screen.
 */
class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  async open() {
    await this.goto('/');
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorText() {
    await this.errorMessage.waitFor({ state: 'visible' });
    return (await this.errorMessage.textContent())?.trim() ?? '';
  }

  async isErrorVisible() {
    return this.errorMessage.isVisible();
  }
}

module.exports = { LoginPage };
