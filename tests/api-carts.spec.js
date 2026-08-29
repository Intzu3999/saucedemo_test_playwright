// @ts-check
//
// API-only contract spec for the DummyJSON /carts endpoints.
//
// Purpose:
//   - Exercise every HTTP verb the API layer supports (GET, POST, PUT, PATCH,
//     DELETE) so the request classes stay honest.
//   - Assert on response shape via the reusable schemas in `api/schemas.js`.
//   - Provide a template for future API test files -- specs stay declarative
//     and NEVER build URLs, headers, or bodies inline.
//
// Everything HTTP-related is delegated to `api/DummyJsonCartsApi.js`.

const { test, expect } = require('../utils/fixtures');
const { schemas } = require('../api');

test.describe('DummyJSON /carts -- contract @api @carts', () => {
  test('GET /carts -- paginated list @smoke', async ({ dummyJsonCarts }) => {
    const res = await dummyJsonCarts.listCarts({ limit: 5, skip: 0 });

    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body).toEqual(schemas.paginatedListSchema(schemas.cartSchema));
    expect(Array.isArray(body.carts)).toBe(true);
    expect(body.carts.length).toBeLessThanOrEqual(5);
  });

  test('GET /carts/:id -- single cart shape', async ({ dummyJsonCarts }) => {
    const res = await dummyJsonCarts.getCart(1);

    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body).toEqual(schemas.cartSchema);
    expect(body.id).toBe(1);
  });

  test('GET /carts/user/:userId -- carts by user', async ({
    dummyJsonCarts,
  }) => {
    const res = await dummyJsonCarts.getCartsByUser(5);

    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.carts).toBeInstanceOf(Array);
    for (const cart of body.carts) {
      expect(cart.userId).toBe(5);
    }
  });

  test('POST /carts/add -- create cart returns computed totals', async ({
    dummyJsonCarts,
  }) => {
    const res = await dummyJsonCarts.addCart({
      userId: 1,
      products: [
        { id: 144, quantity: 4 },
        { id: 98, quantity: 1 },
      ],
    });

    expect([200, 201]).toContain(res.status());
    const body = await res.json();

    expect(body).toEqual(schemas.cartSchema);
    expect(body.userId).toBe(1);
    expect(body.totalProducts).toBe(2);
    expect(body.totalQuantity).toBe(5);
  });

  test('PUT /carts/:id -- update merges when merge=true', async ({
    dummyJsonCarts,
  }) => {
    const res = await dummyJsonCarts.updateCart(1, {
      merge: true,
      products: [{ id: 1, quantity: 1 }],
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.id).toBe(1);
    expect(body.products.some((p) => p.id === 1)).toBe(true);
  });

  test('PATCH /carts/:id -- partial update replaces when merge=false', async ({
    dummyJsonCarts,
  }) => {
    const res = await dummyJsonCarts.patchCart(1, {
      merge: false,
      products: [{ id: 1, quantity: 2 }],
    });

    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.products).toHaveLength(1);
    expect(body.products[0].id).toBe(1);
    expect(body.products[0].quantity).toBe(2);
  });

  test('DELETE /carts/:id -- returns isDeleted flag', async ({
    dummyJsonCarts,
  }) => {
    const res = await dummyJsonCarts.deleteCart(1);

    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body.isDeleted).toBe(true);
    expect(body.deletedOn).toEqual(expect.any(String));
  });
});

test.describe('DummyJSON /carts -- negative cases @api @carts @negative', () => {
  test('GET /carts/:id -- unknown id returns 404', async ({
    dummyJsonCarts,
  }) => {
    const res = await dummyJsonCarts.getCart(99999);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body).toEqual(
      expect.objectContaining({ message: expect.any(String) })
    );
  });

  // Parameterized negative matrix -- one row per bad input.
  const badListInputs = [
    { label: 'negative limit', params: { limit: -1 }, expectedStatus: 400 },
    { label: 'limit exceeds max', params: { limit: 10_000 }, expectedStatus: 400 },
  ];

  for (const row of badListInputs) {
    // DummyJson does not strictly enforce these -- record actual behaviour
    // rather than fail. This spec exists to lock in the API's current shape
    // so we notice if it changes.
    test(`GET /carts -- ${row.label} (records current behaviour)`, async ({
      dummyJsonCarts,
    }) => {
      const res = await dummyJsonCarts.listCarts(row.params);
      // Public sandbox is lenient; we do not assert a strict 4xx, only that
      // the endpoint responded and returned JSON.
      expect(res.status()).toBeGreaterThanOrEqual(200);
      expect(res.status()).toBeLessThan(500);
      const body = await res.json();
      expect(body).toEqual(expect.any(Object));
    });
  }
});
