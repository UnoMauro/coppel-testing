import { Page } from '@playwright/test';

import { BasePage } from './BasePage';

export class SearchResultsPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  private productCard(index: number) {
    return this.page.locator(`[data-testid="product-${index}"]`);
  }

  // Los resultados se renderizan de forma asíncrona tras la navegación, así
  // que se espera a que la primera tarjeta exista antes de leer nada.
  private async waitForResults() {
    await this.productCard(0).waitFor({ state: 'visible', timeout: 15000 });
  }

  async getResultsCountText(): Promise<string> {
    await this.waitForResults();
    return (await this.page.locator('[data-testid="product_total_count"]').first().textContent())?.trim() ?? '';
  }

  async getProductCardCount(): Promise<number> {
    await this.waitForResults();
    return this.page.locator('[data-testid^="product-"]').count();
  }

  async getProductTitle(index: number): Promise<string> {
    await this.waitForResults();
    return (await this.productCard(index).locator('a').first().textContent())?.trim() ?? '';
  }

  async openProduct(index: number = 0) {
    await this.waitForResults();
    await this.productCard(index).locator('a').first().click();
  }

}
