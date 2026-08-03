import { test, expect } from '../utils/coppelApiClient';
import { PriceResponseSchema } from '../schemas/coppel.schemas';
import fixtures from '../fixtures/products.json';

test.describe('API Coppel - precios (GraphQL)', () => {

  test('GET_PRICE devuelve un precio válido para cada SKU conocido', async ({ coppelApi }) => {
    const skuIds = fixtures.products.map(p => p.skuId);

    const { status, body: rawBody } = await coppelApi.getPrice(skuIds);
    expect(status).toBe(200);

    const body = PriceResponseSchema.parse(rawBody);
    expect(body.data.getPrice).toHaveLength(skuIds.length);

    for (const entry of body.data.getPrice) {
      expect(skuIds).toContain(entry.skuId);
      expect(entry.listAmount).toBeGreaterThan(0);
    }
  });

});
