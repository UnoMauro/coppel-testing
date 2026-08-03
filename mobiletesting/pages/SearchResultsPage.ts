import { BasePage } from './BasePage';

export class SearchResultsPage extends BasePage {

  private productCard(index: number) {
    return this.driver.$(`[data-testid="product-${index}"]`);
  }

  // Los resultados se renderizan de forma asíncrona tras la navegación, así
  // que se espera a que la primera tarjeta exista antes de leer nada.
  private async waitForResults() {
    await this.productCard(0).waitForDisplayed({ timeout: 30000 });
  }

  async getResultsCountText(): Promise<string> {
    await this.waitForResults();
    return this.driver.$('[data-testid="product_total_count"]').getText();
  }

  async getProductTitle(index: number): Promise<string> {
    await this.waitForResults();
    return this.productCard(index).$('a').getText();
  }

  async openProduct(index: number = 0) {
    await this.waitForResults();
    await this.productCard(index).$('a').click();
  }

}
