import { test, expect, Page } from '@playwright/test';

import { HomePage } from '../pages/HomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { ProductPage } from '../pages/ProductPage';

// Mismo producto que usa el suite de API (apitesting/fixtures/products.json),
// para que un fallo en un lado y no en el otro sea información real, no
// ruido por estar probando artículos distintos.
const JERSEY_ARGENTINA_HREF = '/pdp/jersey-local-seleccion-argentina-manga-larga-adidas-copa-mundial-2026-para-hombre-mkp-747445032';

async function openFirstJerseyArgentina(page: Page): Promise<ProductPage> {
  const home = new HomePage(page);
  await home.goto();
  await home.search('jersey argentina');

  const results = new SearchResultsPage(page);
  await results.openProduct(0);

  return new ProductPage(page);
}

// Para los tests que necesitan un producto conocido y en stock (cantidad,
// talla, carrito) se navega directo a la ficha fija, en vez de depender del
// primer resultado de búsqueda -- ese orden puede cambiar y apuntar a un
// producto sin stock en alguna talla (nos pasó con el suite de API).
async function openKnownJerseyArgentina(page: Page): Promise<ProductPage> {
  const product = new ProductPage(page);
  await product.goto(JERSEY_ARGENTINA_HREF);
  return product;
}

test.describe('Coppel - búsqueda y jersey de Argentina', () => {

  test('buscar "argentina" muestra resultados relacionados', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();
    await home.search('argentina');
    const results = new SearchResultsPage(page);
    const countText = await results.getResultsCountText();
    expect(countText).toMatch(/\d+\s*resultados/);
    const firstTitle = await results.getProductTitle(0);
    expect(firstTitle.toLowerCase()).toContain('argentina');
  });

  test('dar clic en un jersey de Argentina abre su ficha de producto', async ({ page }) => {
    const product = await openFirstJerseyArgentina(page);
    await expect(page).toHaveURL(/\/pdp\//);
    const title = await product.getProductTitle();
    expect(title.toLowerCase()).toContain('argentina');
  });

  test('el control de cantidad puede sumar y restar', async ({ page }) => {
    const product = await openKnownJerseyArgentina(page);
    expect(await product.getQuantity()).toBe(1);
    await product.increaseQuantity();
    expect(await product.getQuantity()).toBe(2);
    await product.decreaseQuantity();
    expect(await product.getQuantity()).toBe(1);
  });

  test('la talla es clickeable y queda seleccionada', async ({ page }) => {
    const product = await openKnownJerseyArgentina(page);

    await product.selectSize('M');
  });

  test('agregar al carrito está habilitado y el contador pasa de 0 a 1', async ({ page }) => {
    const product = await openKnownJerseyArgentina(page);

    expect(await product.getCartBadgeCount()).toBe(0);

    await product.selectSize('M');
    expect(await product.isAddToCartEnabled()).toBe(true);
    await product.addToCart();

    const confirmation = await product.getAddedToCartConfirmationText();
    expect(confirmation).toMatch(/agregado al carrito/i);

    expect(await product.getCartBadgeCount()).toBe(1);
  });

});

///TEST