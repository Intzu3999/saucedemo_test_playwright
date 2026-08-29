// @ts-check

const { BaseApi } = require('./BaseApi');

/**
 * DummyJsonCartsApi -- typed wrapper over https://dummyjson.com/carts.
 *
 * DummyJson is a *mock* backend: writes (POST/PUT/PATCH/DELETE) do not persist,
 * but the responses reflect what a real server would return. That is exactly
 * what we want for API contract tests -- shape + status codes are honoured.
 *
 * Docs: https://dummyjson.com/docs/carts
 */
class DummyJsonCartsApi extends BaseApi {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} [baseUrl='https://dummyjson.com']
   */
  constructor(request, baseUrl = 'https://dummyjson.com') {
    super(request, baseUrl);
  }

  /**
   * GET /carts -- paginated list of carts (default limit 30).
   * @param {{ limit?: number, skip?: number, select?: string }} [opts]
   */
  listCarts(opts = {}) {
    return this.get('/carts', { params: opts });
  }

  /**
   * GET /carts/:id
   * @param {number | string} id
   */
  getCart(id) {
    return this.get(`/carts/${id}`);
  }

  /**
   * GET /carts/user/:userId -- all carts for a specific user.
   * @param {number | string} userId
   */
  getCartsByUser(userId) {
    return this.get(`/carts/user/${userId}`);
  }

  /**
   * @typedef {Object} CartLine
   * @property {number} id       - Product id.
   * @property {number} quantity - Quantity to add.
   */

  /**
   * POST /carts/add -- simulate creating a new cart.
   * @param {{ userId: number, products: CartLine[] }} body
   */
  addCart(body) {
    return this.post('/carts/add', body);
  }

  /**
   * PUT /carts/:id -- replace or merge cart contents.
   * Pass `merge: true` to append to the existing product list.
   * @param {number | string} id
   * @param {{ merge?: boolean, products: CartLine[] }} body
   */
  updateCart(id, body) {
    return this.put(`/carts/${id}`, { merge: true, ...body });
  }

  /**
   * PATCH /carts/:id -- partial update. Same body shape as PUT.
   * @param {number | string} id
   * @param {{ merge?: boolean, products: CartLine[] }} body
   */
  patchCart(id, body) {
    return this.patch(`/carts/${id}`, { merge: false, ...body });
  }

  /**
   * DELETE /carts/:id
   * @param {number | string} id
   */
  deleteCart(id) {
    return this.delete(`/carts/${id}`);
  }
}

module.exports = { DummyJsonCartsApi };
