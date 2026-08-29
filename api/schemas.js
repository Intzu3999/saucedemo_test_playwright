// @ts-check

/**
 * Lightweight response-shape validators for DummyJSON.
 *
 * These are plain objects consumed with Playwright's
 * `expect(body).toEqual(expect.objectContaining(schema))` -- no external
 * dependencies required. Kept intentionally minimal: we only assert on the
 * fields we actually depend on so DummyJSON adding new fields does not break
 * our tests.
 *
 * If we ever need full JSON-Schema validation (or Pydantic-style parsing like
 * in `nexus-api-testing-automation`), swap this file for `ajv` + real schemas.
 */

const { expect } = require('@playwright/test');

/**
 * Shape of a DummyJson user (partial).
 * Only fields the checkout / API+UI validation relies on are asserted.
 */
const userSchema = expect.objectContaining({
  id: expect.any(Number),
  firstName: expect.any(String),
  lastName: expect.any(String),
  address: expect.objectContaining({
    postalCode: expect.anything(),
  }),
});

/**
 * Shape of a single cart line item.
 */
const cartLineSchema = expect.objectContaining({
  id: expect.any(Number),
  title: expect.any(String),
  price: expect.any(Number),
  quantity: expect.any(Number),
  total: expect.any(Number),
});

/**
 * Shape of a full cart response (single).
 */
const cartSchema = expect.objectContaining({
  id: expect.any(Number),
  products: expect.arrayContaining([cartLineSchema]),
  total: expect.any(Number),
  totalProducts: expect.any(Number),
  totalQuantity: expect.any(Number),
  userId: expect.any(Number),
});

/**
 * Shape of the paginated list wrapper used by /users and /carts list endpoints.
 * The `itemSchema` argument is accepted for parity/future use but not asserted
 * here -- DummyJSON's list payloads vary the array key name (`users`, `carts`,
 * `products`) so we only assert on the pagination envelope.
 * @param {unknown} [itemSchema]
 */
function paginatedListSchema(itemSchema) {
  return expect.objectContaining({
    total: expect.any(Number),
    skip: expect.any(Number),
    limit: expect.any(Number),
  });
}

module.exports = {
  userSchema,
  cartLineSchema,
  cartSchema,
  paginatedListSchema,
};
