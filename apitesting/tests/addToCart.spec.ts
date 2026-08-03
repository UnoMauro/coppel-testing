import { test, expect } from '../utils/coppelApiClient';
import { AddItemToBasketResponseSchema } from '../schemas/coppel.schemas';
import fixtures from '../fixtures/products.json';

test.describe('API Coppel - agregar al carrito (GraphQL mutation)', () => {

  test('AddItemToBasket agrega el jersey de Argentina y devuelve el basket actualizado', async ({ coppelApi }) => {
    const product = fixtures.products[0];

    const { status, body: rawBody } = await coppelApi.addItemToBasket(product.skuId, 1, fixtures.nodeContext);
    expect(status).toBe(200);
    expect(rawBody.errors, `La API devolvió errores: ${JSON.stringify(rawBody.errors)}`).toBeUndefined();

    const body = AddItemToBasketResponseSchema.parse(rawBody);
    const { basketId, productItems } = body.data.addItemToBasket;
    expect(basketId.length).toBeGreaterThan(0);

    const addedItem = productItems.find(item => item.productId === product.skuId);
    expect(addedItem).toBeDefined();
    expect(addedItem?.quantity).toBe(1);
    expect(addedItem?.productName.toLowerCase()).toContain('argentina');
  });

});
