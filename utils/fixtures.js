// @ts-check

const base = require('@playwright/test');
const { DummyJsonUsersApi, DummyJsonCartsApi } = require('../api');
const { envOrDefault } = require('./helpers');

/**
 * Fixtures for API tests.
 *
 * Extends Playwright's built-in `test` so specs can destructure ready-made
 * API clients the same way they destructure `page`:
 *
 *   const { test, expect } = require('../utils/fixtures');
 *
 *   test('list carts', async ({ dummyJsonCarts }) => {
 *     const res = await dummyJsonCarts.listCarts({ limit: 5 });
 *     expect(res.status()).toBe(200);
 *   });
 *
 * Why a fixture and not a plain factory?
 *   - Playwright manages the underlying APIRequestContext lifecycle.
 *   - `ignoreHTTPSErrors` and `baseURL` are pulled from env exactly once, in
 *     one place, instead of every spec repeating the boilerplate.
 *   - Per-test isolation is preserved (each test gets a fresh context).
 */

const IGNORE_HTTPS_ERRORS =
  (process.env.IGNORE_HTTPS_ERRORS ?? 'false').toLowerCase() === 'true';

const DUMMYJSON_BASE_URL = envOrDefault(
  'DUMMYJSON_BASE_URL',
  'https://dummyjson.com'
);

/**
 * @typedef {Object} ApiFixtures
 * @property {import('@playwright/test').APIRequestContext} apiRequest
 * @property {DummyJsonUsersApi} dummyJsonUsers
 * @property {DummyJsonCartsApi} dummyJsonCarts
 */

const test = /** @type {import('@playwright/test').TestType<
 *   import('@playwright/test').PlaywrightTestArgs
 *   & import('@playwright/test').PlaywrightTestOptions
 *   & ApiFixtures,
 *   import('@playwright/test').PlaywrightWorkerArgs
 *   & import('@playwright/test').PlaywrightWorkerOptions
 * >} */ (
  base.test.extend({
    /**
     * A pre-configured Playwright APIRequestContext. Handles corporate SSL
     * interception via IGNORE_HTTPS_ERRORS so specs never touch that flag.
     */
    apiRequest: async ({ playwright }, use) => {
      const context = await playwright.request.newContext({
        ignoreHTTPSErrors: IGNORE_HTTPS_ERRORS,
      });
      await use(context);
      await context.dispose();
    },

    /**
     * DummyJSON /users client.
     * @param {{ apiRequest: import('@playwright/test').APIRequestContext }} args
     */
    dummyJsonUsers: async ({ apiRequest }, use) => {
      await use(new DummyJsonUsersApi(apiRequest, DUMMYJSON_BASE_URL));
    },

    /**
     * DummyJSON /carts client.
     * @param {{ apiRequest: import('@playwright/test').APIRequestContext }} args
     */
    dummyJsonCarts: async ({ apiRequest }, use) => {
      await use(new DummyJsonCartsApi(apiRequest, DUMMYJSON_BASE_URL));
    },
  })
);

const { expect } = base;

module.exports = { test, expect };
