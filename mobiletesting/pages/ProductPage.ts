import { BasePage } from './BasePage';

export class ProductPage extends BasePage {

  async goto(path: string) {
    await super.goto(path);
    await this.driver.$('h1').waitForDisplayed({ timeout: 20000 });
  }

  async getProductTitle(): Promise<string> {
    return this.driver.$('h1').getText();
  }

  private sizeButton(size: string) {
    return this.driver.$(`[data-testid="product_size_selector_${size}"] button`);
  }

  // El selector de talla y el de cantidad se cargan de forma asíncrona detrás
  // de un `data-testid="skeleton"` -- justo después de que el h1 aparece
  // (que sí viene en el HTML inicial) todavía no existen en el DOM, así que
  // hay que esperarlos explícitamente en vez de interactuar directo.
  async selectSize(size: string) {
    const button = this.sizeButton(size);
    await button.waitForDisplayed({ timeout: 20000 });
    await button.click();
    await this.driver.waitUntil(
      async () => (await button.getAttribute('class'))?.includes('selected') ?? false,
      { timeout: 5000, timeoutMsg: `la talla ${size} no quedó seleccionada` },
    );
  }

  private quantityInput() {
    return this.driver.$('[data-testid="number_field"]');
  }

  async getQuantity(): Promise<number> {
    const input = this.quantityInput();
    await input.waitForDisplayed({ timeout: 20000 });
    return Number(await input.getValue());
  }

  async increaseQuantity() {
    const before = await this.getQuantity();
    await this.driver.$('[data-testid="number_field_plus_btn"]').click();
    await this.driver.waitUntil(async () => (await this.getQuantity()) === before + 1, { timeout: 5000 });
  }

  async decreaseQuantity() {
    const before = await this.getQuantity();
    await this.driver.$('[data-testid="number_field_minus_btn"]').click();
    await this.driver.waitUntil(async () => (await this.getQuantity()) === before - 1, { timeout: 5000 });
  }

  // Igual que en el suite desktop (pages/ProductPage.ts): el sitio renderiza
  // una variante desktop y otra mobile con el mismo testid, solo una visible
  // según el viewport -- WebDriver no tiene el pseudo-selector :visible de
  // Playwright, así que se filtra a mano con isDisplayed().
  private async addToCartButton() {
    const candidates = await this.driver.$$('[data-testid="add_to_cart_modal_cta"]');
    for (const el of candidates) {
      if (await el.isDisplayed()) return el;
    }
    throw new Error('No se encontró un botón add_to_cart_modal_cta visible en este viewport');
  }

  async isAddToCartEnabled(): Promise<boolean> {
    return (await this.addToCartButton()).isEnabled();
  }

  async addToCart() {
    await (await this.addToCartButton()).click();
  }

  async getAddedToCartConfirmationText(): Promise<string> {
    const modalTitle = this.driver.$('[data-testid="add_to_cart_modal_title"]');
    await modalTitle.waitForDisplayed({ timeout: 10000 });
    return modalTitle.getText();
  }

  async getCartBadgeCount(): Promise<number> {
    const badge = this.driver.$('[data-testid="header_cart_badge"]');
    if (!(await badge.isDisplayed().catch(() => false))) {
      return 0;
    }
    return Number((await badge.getText()) || '0');
  }

}
