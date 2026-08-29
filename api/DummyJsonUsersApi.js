// @ts-check

const { BaseApi } = require('./BaseApi');

/**
 * DummyJsonUsersApi -- typed wrapper over https://dummyjson.com/users.
 * Only exposes the endpoints we actually use so the surface is small and
 * self-documenting.
 *
 * Docs: https://dummyjson.com/docs/users
 */
class DummyJsonUsersApi extends BaseApi {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} [baseUrl='https://dummyjson.com']
   */
  constructor(request, baseUrl = 'https://dummyjson.com') {
    super(request, baseUrl);
  }

  /**
   * GET /users -- paginated list of users.
   * @param {{ limit?: number, skip?: number, select?: string }} [opts]
   */
  listUsers(opts = {}) {
    return this.get('/users', { params: opts });
  }

  /**
   * GET /users/:id
   * @param {number | string} id
   */
  getUser(id) {
    return this.get(`/users/${id}`);
  }

  /**
   * GET /users/search?q=...
   * @param {string} query
   */
  searchUsers(query) {
    return this.get('/users/search', { params: { q: query } });
  }
}

module.exports = { DummyJsonUsersApi };
