import { test, expect } from '../utils/coppelApiClient';
import { InventoryResponseSchema } from '../schemas/coppel.schemas';
import fixtures from '../fixtures/products.json';

test.describe('API Coppel - inventario (GraphQL)', () => {

  test('GetInventory reporta disponibilidad para los SKUs del jersey de Argentina', async ({ coppelApi }) => {
    const skuIds = fixtures.products.map(p => p.skuId);

    const { status, body: rawBody } = await coppelApi.getInventory(skuIds, fixtures.nodeContext);
    expect(status).toBe(200);

    const body = InventoryResponseSchema.parse(rawBody);
    expect(body.data.inventory).toHaveLength(skuIds.length);

    for (const entry of body.data.inventory) {
      expect(entry.inventoryStatus).toBe(true);
      expect(Number(entry.availableQuantity)).toBeGreaterThanOrEqual(0);
    }
  });

});
