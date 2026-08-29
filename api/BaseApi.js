// @ts-check

/**
 * BaseApi -- shared HTTP verb helpers built on Playwright's APIRequestContext.
 *
 * Every concrete API client (DummyJsonUsersApi, DummyJsonCartsApi, ...) extends
 * this class. The pattern deliberately mirrors `pages/BasePage.js` so the same
 * mental model applies:
 *   - POM: BasePage <- LoginPage / InventoryPage / ...  driven by a `page`.
 *   - API: BaseApi <- DummyJsonUsersApi / DummyJsonCartsApi / ...  driven by a `request`.
 *
 * Specs never build URLs, headers, or JSON bodies by hand. They call semantic
 * methods on the client (e.g. `users.getUser(1)`, `carts.addCart({...})`) and
 * receive Playwright's `APIResponse`, which they can then assert on.
 */
class BaseApi {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} baseUrl - Base URL of the API (no trailing slash).
   */
  constructor(request, baseUrl) {
    if (!request) throw new Error('BaseApi: `request` is required');
    if (!baseUrl) throw new Error('BaseApi: `baseUrl` is required');
    this.request = request;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Build an absolute URL from a path + optional query params.
   * @param {string} path
   * @param {Record<string, string | number | boolean | undefined | null>} [params]
   * @returns {string}
   */
  buildUrl(path, params) {
    const url = new URL(
      path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
    );
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  /**
   * Default JSON headers -- extend per-request via `options.headers`.
   * @returns {Record<string, string>}
   */
  defaultHeaders() {
    return { 'Content-Type': 'application/json', Accept: 'application/json' };
  }

  /**
   * @typedef {Object} RequestOptions
   * @property {Record<string, string | number | boolean | undefined | null>} [params]
   * @property {Record<string, string>} [headers]
   * @property {number} [timeout]
   */

  /**
   * @param {string} path
   * @param {RequestOptions} [options]
   */
  get(path, options = {}) {
    return this.request.get(this.buildUrl(path, options.params), {
      headers: { ...this.defaultHeaders(), ...(options.headers || {}) },
      timeout: options.timeout,
    });
  }

  /**
   * @param {string} path
   * @param {unknown} data
   * @param {RequestOptions} [options]
   */
  post(path, data, options = {}) {
    return this.request.post(this.buildUrl(path, options.params), {
      headers: { ...this.defaultHeaders(), ...(options.headers || {}) },
      data,
      timeout: options.timeout,
    });
  }

  /**
   * @param {string} path
   * @param {unknown} data
   * @param {RequestOptions} [options]
   */
  put(path, data, options = {}) {
    return this.request.put(this.buildUrl(path, options.params), {
      headers: { ...this.defaultHeaders(), ...(options.headers || {}) },
      data,
      timeout: options.timeout,
    });
  }

  /**
   * @param {string} path
   * @param {unknown} data
   * @param {RequestOptions} [options]
   */
  patch(path, data, options = {}) {
    return this.request.patch(this.buildUrl(path, options.params), {
      headers: { ...this.defaultHeaders(), ...(options.headers || {}) },
      data,
      timeout: options.timeout,
    });
  }

  /**
   * @param {string} path
   * @param {RequestOptions} [options]
   */
  delete(path, options = {}) {
    return this.request.delete(this.buildUrl(path, options.params), {
      headers: { ...this.defaultHeaders(), ...(options.headers || {}) },
      timeout: options.timeout,
    });
  }
}

module.exports = { BaseApi };
