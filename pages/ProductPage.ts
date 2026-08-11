import { Page, expect } from '@playwright/test';

import { BasePage } from './BasePage';

export class ProductPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  async getProductTitle(): Promise<string> {
    return (await this.page.locator('h1').first().textContent())?.trim() ?? '';
  }

  async getPrice(): Promise<string> {
    const discounted = this.page.locator('[data-testid="pdp_discounted_price"]');
    if (await discounted.count() > 0) {
      return (await discounted.first().textContent())?.trim() ?? '';
    }
    return (await this.page.locator('[data-testid="pdp_price"]').first().textContent())?.trim() ?? '';
  }

  private sizeButton(size: string) {
    return this.page.locator(`[data-testid="product_size_selector_${size}"] button`);
  }

  async selectSize(size: string) {
    const button = this.sizeButton(size);
    await button.click();
    await expect(button).toHaveClass(/selected/);
  }

  private quantityInput() {
    return this.page.locator('[data-testid="number_field"]');
  }

  async getQuantity(): Promise<number> {
    return Number(await this.quantityInput().inputValue());
  }

  async increaseQuantity() {
    const before = await this.getQuantity();
    await this.page.locator('[data-testid="number_field_plus_btn"]').click();
    await expect(this.quantityInput()).toHaveValue(String(before + 1));
  }

  async decreaseQuantity() {
    const before = await this.getQuantity();
    await this.page.locator('[data-testid="number_field_minus_btn"]').click();
    await expect(this.quantityInput()).toHaveValue(String(before - 1));
  }

  private addToCartButton() {
    // El sitio renderiza una variante desktop y otra mobile con el mismo
    // testid; solo una está visible según el viewport, así que se filtra
    // por visibilidad en vez de usar .first().
    return this.page.locator('[data-testid="add_to_cart_modal_cta"]:visible');
  }

  async isAddToCartEnabled(): Promise<boolean> {
    return this.addToCartButton().isEnabled();
  }

  async addToCart() {
    await this.addToCartButton().click();
  }

   async getAddedToCartConfirmationText(): Promise<string> {
    const modalTitle = this.page.locator('[data-testid="add_to_cart_modal_title"]');
    // El modal de "elige tu ciudad de entrega" puede reaparecer justo al
    // agregar al carrito (no solo al cargar la página, que es donde
    // BasePage.goto ya lo intenta cerrar) y tapar el de confirmación --
    // pero ese TAMBIÉN es un dialog con botón "Cerrar", así que solo se
    // cierra un dialog aquí si NO es el de "Agregado al carrito".
    const otherDialog = this.page.getByRole('dialog').filter({ hasNotText: 'Agregado al carrito' });
    await otherDialog.getByRole('button', { name: 'Cerrar' }).click({ timeout: 3000 }).catch(() => {});
    await expect(modalTitle).toBeVisible({ timeout: 10000 });
    return (await modalTitle.textContent())?.trim() ?? '';

  }
 

  async getCartBadgeCount(): Promise<number> {
    const badge = this.page.locator('[data-testid="header_cart_badge"]');
    if (!(await badge.isVisible().catch(() => false))) {
      return 0;
    }
    return Number((await badge.textContent())?.trim() ?? '0');
  }

}
