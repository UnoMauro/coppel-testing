import { test as base, chromium, APIRequestContext, APIResponse } from '@playwright/test';
import { randomUUID } from 'crypto';

// Hashes de persisted queries capturados inspeccionando el tráfico real de
// coppel.com. Coppel usa Apollo persisted queries: el servidor ya reconoce
// estos hashes, así que no hace falta enviar el texto completo de la query.
const PERSISTED_QUERIES = {
  GET_SEARCH_RESULTS: '16211b49739ac87f6f09081b7f8b4d7d2240cf56ebd5e61f4a27dcee1820dde0',
  GET_PRICE: 'cbfb77439d1fe06a9352ee64c36d1b1a0887b9c89961385530e39285f6e20473',
  GetInventory: '1018444af16f2f1004632fd28299c498123824881715a3951da51eef3cf1b898',
  AddItemToBasket: 'c80c1a3997f419a4099d014f4cccbe9bc169161d4afdc6d4c0c46812e9b0e4e8',
} as const;

type OperationName = keyof typeof PERSISTED_QUERIES;

interface NodeContext {
  pmNodeId: string;
  prNodeId: string;
  regionId?: string;
  geoCityID?: string;
}

export interface GraphQLResult<T = any> {
  status: number;
  body: T;
}

export class CoppelApiClient {

  constructor(private request: APIRequestContext, private token: string) {}

  // El backend de Coppel a veces devuelve un error genérico transitorio
  // ("Algo salió mal. Intenta más tarde") cuando el mismo token/sesión hace
  // varias llamadas seguidas en poco tiempo -- se ve como throttling del
  // lado del servidor, no como un problema del cliente. Se reintenta con
  // backoff antes de dar el resultado por definitivo.
  private async withRetry(makeRequest: () => Promise<APIResponse>, attempts = 3): Promise<GraphQLResult> {
    let result: GraphQLResult = { status: 0, body: null };

    for (let attempt = 1; attempt <= attempts; attempt++) {
      const res = await makeRequest();
      result = { status: res.status(), body: await res.json() };

      if (!result.body?.errors) {
        return result;
      }
      if (attempt < attempts) {
        await new Promise(resolve => setTimeout(resolve, 750 * attempt));
      }
    }

    return result;
  }

  // Varios de los microservicios detrás del gateway de GraphQL (basket,
  // product/inventory) devuelven "internal-server-error"/"authorization-error"
  // si faltan estos headers, incluso en operaciones de solo lectura vía GET
  // -- se replican exactamente los que manda el navegador real, capturados
  // inspeccionando el tráfico de red del sitio.
  private commonHeaders() {
    return {
      authorization: `Bearer ${this.token}`,
      'content-type': 'application/json',
      accept: '*/*',
      'x-channel': 'web',
      'x-app-session-id': randomUUID(),
      'x-correlation-id': randomUUID(),
      referer: 'https://www.coppel.com/',
    };
  }

  private graphqlGet(operationName: OperationName, variables: Record<string, unknown>) {
    return this.withRetry(() => this.request.get('/graphql', {
      headers: this.commonHeaders(),
      params: {
        operationName,
        variables: JSON.stringify(variables),
        extensions: JSON.stringify({ persistedQuery: { version: 1, sha256Hash: PERSISTED_QUERIES[operationName] } }),
      },
    }));
  }

  private graphqlPost(operationName: OperationName, variables: Record<string, unknown>) {
    return this.withRetry(() => this.request.post('/graphql', {
      headers: this.commonHeaders(),
      data: {
        operationName,
        variables,
        extensions: { persistedQuery: { version: 1, sha256Hash: PERSISTED_QUERIES[operationName] } },
      },
    }));
  }

  searchProducts(searchTerm: string, nodeContext: NodeContext) {
    // GET_SEARCH_RESULTS valida el shape de nodeContext estrictamente: pasar
    // geoCityID (que sí necesitan basket/inventory) lo rompe con un error
    // genérico del servidor, así que aquí solo se envían los 3 campos reales.
    const { pmNodeId, prNodeId, regionId } = nodeContext;
    return this.graphqlGet('GET_SEARCH_RESULTS', {
      searchTerm,
      pageNumber: 1,
      pageSize: 24,
      orderBy: '0',
      filter: [],
      nodeContext: { pmNodeId, prNodeId, regionId },
    });
  }

  getPrice(skuIds: string[]) {
    return this.graphqlGet('GET_PRICE', { input: { skuIds } });
  }

  getInventory(skuIds: string[], nodeContext: NodeContext) {
    return this.graphqlGet('GetInventory', {
      pmNodeId: nodeContext.pmNodeId,
      prNodeId: nodeContext.prNodeId,
      skuIds,
    });
  }

  addItemToBasket(productId: string, quantity: number, nodeContext: NodeContext) {
    return this.graphqlPost('AddItemToBasket', {
      input: {
        productItems: [{ productId, quantity }],
        basketId: '',
        pmNodeId: nodeContext.pmNodeId,
        prNodeId: nodeContext.prNodeId,
        geoCityID: nodeContext.geoCityID,
      },
    });
  }

}

// Coppel no expone un POST /auth: el JWT de invitado ("azt") se genera del
// lado del cliente como parte del arranque de la SPA (probablemente ligado a
// fingerprinting anti-bot), así que se usa un navegador real para obtenerlo.
//
// El token parece tener un límite de llamadas por sesión: reusar el mismo
// token para varias llamadas seguidas (fixture worker-scoped) empezaba a
// fallar con errores genéricos del servidor a partir de la 3ra/4ta llamada.
// Por eso el fixture es test-scoped (un token nuevo por test) en vez de
// worker-scoped -- más lento, pero confiable con solo 5 tests.
export const test = base.extend<{ coppelApi: CoppelApiClient }, object>({
  coppelApi: async ({}, use) => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://www.coppel.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!sessionStorage.getItem('azt'), { timeout: 15000 });
    const token = await page.evaluate(() => sessionStorage.getItem('azt')) as string;

    const client = new CoppelApiClient(context.request, token);
    await use(client);

    await browser.close();
  },
});

export { expect } from '@playwright/test';
