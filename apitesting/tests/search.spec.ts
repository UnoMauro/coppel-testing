import { test, expect } from '../utils/coppelApiClient';
import { SearchResultsResponseSchema } from '../schemas/coppel.schemas';
import fixtures from '../fixtures/products.json';

test.describe('API Coppel - búsqueda de productos (GraphQL)', () => {

  for (const { term, expectedNameContains, minResults } of fixtures.searchTerms) {
    test(`buscar "${term}" devuelve resultados válidos`, async ({ coppelApi }) => {
      const { status, body: rawBody } = await coppelApi.searchProducts(term, fixtures.nodeContext);
      expect(status).toBe(200);

      const body = SearchResultsResponseSchema.parse(rawBody);
      const { totalCount, products } = body.data.getSearchResults;

      expect(totalCount).toBeGreaterThanOrEqual(minResults);
      expect(products.length).toBeGreaterThan(0);
      const matchingProduct = products.some((product) =>
        product.name.toLowerCase().includes(expectedNameContains.toLowerCase()),
      );
      expect(matchingProduct).toBe(true);
    });
  }

});
