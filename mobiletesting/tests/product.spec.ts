import assert from 'node:assert/strict';
import path from 'path';
import dotenv from 'dotenv';
import { remote, type Browser } from 'webdriverio';

import { HomePage } from '../pages/HomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { ProductPage } from '../pages/ProductPage';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Mismo producto que usan los suites de desktop y de API (tests/product.spec.ts,
// apitesting/fixtures/products.json), para que un fallo aquí y no ahí sea
// información real sobre el viewport mobile, no ruido por artículos distintos.
const JERSEY_ARGENTINA_HREF = '/pdp/jersey-local-seleccion-argentina-manga-larga-adidas-copa-mundial-2026-para-hombre-mkp-747445032';

describe('Coppel mobile (emulador Android Studio) - búsqueda y jersey de Argentina', () => {

  let driver: Browser;

  // La sesión de Appium se maneja a mano con Mocha en vez de con @wdio/cli
  // -- ver README ("test:mobile") para el porqué.
  before(async () => {
    driver = await remote({
      hostname: '127.0.0.1',
      port: 4723,
      path: '/wd/hub',
      logLevel: 'warn',
      capabilities: {
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        // Nombre del AVD creado en Android Studio (Tools > Device Manager).
        'appium:deviceName': process.env.ANDROID_AVD_NAME || 'Pixel_6_Coppel',
        'appium:browserName': 'Chrome',
        'appium:newCommandTimeout': 120,
        // El emulador trae un Chrome fijo de la imagen del sistema (no se
        // autoactualiza); sin esto, uiautomator2 falla con "No Chromedriver
        // found that can automate Chrome X" si no hay uno cacheado para esa
        // versión exacta. Requiere levantar Appium con
        // `--allow-insecure uiautomator2:chromedriver_autodownload` (ver
        // README).
        'appium:chromedriverAutodownload': true,
      },
      baseUrl: process.env.BASE_URL,
    });
  });

  after(async () => {
    await driver?.deleteSession();
  });

  async function openFirstJerseyArgentina(): Promise<ProductPage> {
    const home = new HomePage(driver);
    await home.goto();
    await home.search('jersey argentina');

    const results = new SearchResultsPage(driver);
    await results.openProduct(0);

    return new ProductPage(driver);
  }

  // Para los tests que necesitan un producto conocido y en stock se navega
  // directo a la ficha fija, en vez de depender del primer resultado de
  // búsqueda -- ver la misma nota en tests/product.spec.ts del suite desktop.
  async function openKnownJerseyArgentina(): Promise<ProductPage> {
    const product = new ProductPage(driver);
    await product.goto(JERSEY_ARGENTINA_HREF);
    return product;
  }

  it('buscar "argentina" muestra resultados relacionados', async () => {
    const home = new HomePage(driver);
    await home.goto();
    await home.search('argentina');

    const results = new SearchResultsPage(driver);
    const countText = await results.getResultsCountText();
    assert.match(countText, /\d+\s*resultados/);

    const firstTitle = await results.getProductTitle(0);
    assert.ok(firstTitle.toLowerCase().includes('argentina'), `título inesperado: ${firstTitle}`);
  });

  it('dar tap en un jersey de Argentina abre su ficha de producto', async () => {
    const product = await openFirstJerseyArgentina();

    const url = await driver.getUrl();
    assert.ok(url.includes('/pdp/'), `URL inesperada: ${url}`);

    const title = await product.getProductTitle();
    assert.ok(title.toLowerCase().includes('argentina'), `título inesperado: ${title}`);
  });

  it('el control de cantidad puede sumar y restar', async () => {
    const product = await openKnownJerseyArgentina();

    assert.equal(await product.getQuantity(), 1);

    await product.increaseQuantity();
    assert.equal(await product.getQuantity(), 2);

    await product.decreaseQuantity();
    assert.equal(await product.getQuantity(), 1);
  });

  it('la talla es clickeable y queda seleccionada', async () => {
    const product = await openKnownJerseyArgentina();
    await product.selectSize('M');
  });

  it('agregar al carrito está habilitado y el contador pasa de 0 a 1', async () => {
    const product = await openKnownJerseyArgentina();

    assert.equal(await product.getCartBadgeCount(), 0);

    await product.selectSize('M');
    assert.equal(await product.isAddToCartEnabled(), true);
    await product.addToCart();

    const confirmation = await product.getAddedToCartConfirmationText();
    assert.match(confirmation, /agregado al carrito/i);

    assert.equal(await product.getCartBadgeCount(), 1);
  });

});
