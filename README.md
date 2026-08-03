# coppel-testing

Suite de automatización de QA contra el sitio real de [Coppel](https://www.coppel.com) — frontend E2E con Playwright y API testing directo contra su GraphQL, ambos sobre el mismo flujo de negocio: buscar el jersey de la selección de Argentina, revisar su ficha, y agregarlo al carrito.

## Estructura

```
pages/            Page Objects del suite de frontend (BasePage, HomePage, SearchResultsPage, ProductPage)
tests/             Tests de frontend (Playwright)
playwright.config.ts

apitesting/
  utils/           Cliente HTTP para la GraphQL de Coppel + fixture de autenticación
  schemas/         Validación de respuestas con zod
  fixtures/        Datos de prueba (términos de búsqueda, SKUs)
  tests/           Tests de API (Playwright)
  playwright.config.ts

mobiletesting/
  pages/           Page Objects mobile (BasePage, HomePage, SearchResultsPage, ProductPage) -- misma
                   forma que pages/, pero reciben el driver de WebdriverIO por constructor y usan
                   selectores/interacciones adaptados al viewport mobile
  tests/           Test de Appium (Mocha + WebdriverIO, sesión manual contra un emulador de Android Studio)
```

## Requisitos

- Node.js 20+
- `.env` en la raíz con:
  ```
  BASE_URL=https://www.coppel.com
  ```

## Instalación

```bash
npm install
npx playwright install chromium
```

## Correr los tests

```bash
npm test           # frontend (Playwright, navegador real)
npm run test:api   # API (Playwright request context, sin navegador salvo para el login)
npm run test:mobile  # frontend mobile (Appium + WebdriverIO, contra un emulador de Android Studio)
```

`test:mobile` requiere, antes de correrlo:

1. Un AVD creado en Android Studio (Tools > Device Manager) corriendo -- por default se conecta a
   uno llamado `Pixel_6_Coppel`; para usar otro, `ANDROID_AVD_NAME=<nombre-del-avd>`.
2. El driver de Appium registrado una sola vez: `npx appium driver install uiautomator2`.
3. Un servidor de Appium corriendo aparte, con la descarga de chromedriver habilitada (el Chrome de
   la imagen del emulador no trae uno compatible incluido):
   ```bash
   npx appium --base-path /wd/hub --allow-insecure uiautomator2:chromedriver_autodownload
   ```

Cada suite genera su propio reporte HTML (`playwright-report/` y `playwright-report-api/` respectivamente), gitignored.

## Notas sobre el sitio real

Ambos suites corren contra la producción real de coppel.com, no un entorno de pruebas ni mocks, así que hay un par de cosas que valen la pena saber:


- **`--headed` y Akamai**: Coppel corre detrás de Akamai Bot Manager (cookies `_abck`/`bm_sz`, header `akamai-grn`). Corriendo el suite de frontend con `npx playwright test --headed` se reprodujo de forma consistente un `net::ERR_HTTP2_PROTOCOL_ERROR` en la navegación a los resultados de búsqueda (`/sd/argentina`) -- la conexión se corta a nivel de protocolo antes de recibir HTML, no es un fallo de los Page Objects ni de los locators. En headless el mismo flujo pasa sin problema. Todo apunta a que la heurística anti-bot de Akamai reacciona a las señales de comportamiento propias de un run headed real (timing distinto de eventos de analítica/interacción del lado del cliente) y responde cortando la conexión en vez de servir un 403 normal. Usar headless (`npm test`, el modo por defecto) como modo confiable; `--headed` sirve para debugging visual puntual pero puede ser bloqueado.

- **`test:mobile` y el mismo bloqueo de Akamai**: el mismo `ERR_HTTP2_PROTOCOL_ERROR` de arriba
  aparece también en el suite mobile, de forma intermitente, en la navegación disparada por Appium --
  no es algo que el código pueda resolver, es Akamai reaccionando a tráfico automatizado por otra vía.
  Mitigado con `--retries 2` en `.mocharc.json`, igual que ambos `playwright.config.ts`. Además, el
  test runner de `@wdio/cli` tiene una incompatibilidad no resuelta con este stack (Appium 3 + el
  emulador de Android Studio): la misma secuencia de comandos falla corrida a través de `wdio run`
  pero funciona de forma confiable con una sesión de WebdriverIO manejada a mano, así que
  `mobiletesting/tests/product.spec.ts` crea su propia sesión con `remote()` en vez de usar `@wdio/cli`.
