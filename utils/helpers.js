// @ts-check

const users = require('../test-data/users.json');
const products = require('../test-data/products.json');
const checkout = require('../test-data/checkout.json');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');

/**
 * Read a value from process.env with an optional fallback.
 * Keeps tests decoupled from direct process.env access.
 * @param {string} key
 * @param {string} [fallback]
 */
function envOrDefault(key, fallback = '') {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
}

/**
 * Full test-data bundle exposed as a single import for tests.
 */
const testData = {
  users,
  products,
  checkout,
};

/**
 * Convenience helper - log in as the "standard" user and land on inventory.
 * Reduces repetition across specs that only care about the post-login state.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<InventoryPage>}
 */
async function loginAsStandardUser(page) {
  return loginAsUser(page, users.standard.username, users.standard.password);
}

/**
 * Log in as an arbitrary user and land on inventory. Assumes the user can
 * actually reach the inventory page (i.e. NOT locked_out_user).
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @param {string} password
 * @returns {Promise<InventoryPage>}
 */
async function loginAsUser(page, username, password) {
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  await loginPage.open();
  await loginPage.login(username, password);
  await inventoryPage.assertLoaded();
  return inventoryPage;
}

/**
 * Parse a saucedemo-style price string (e.g. "$29.99") to a number.
 * @param {string} price
 */
function parsePrice(price) {
  return Number(price.replace(/[^0-9.]/g, ''));
}

module.exports = {
  envOrDefault,
  testData,
  loginAsStandardUser,
  loginAsUser,
  parsePrice,
};
