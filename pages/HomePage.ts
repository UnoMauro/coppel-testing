import { Page } from '@playwright/test';

import { BasePage } from './BasePage';

export class HomePage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto('/');
  }

  async search(term: string) {
    const input = this.page.locator('[data-testid="search_inputfield"]');
    await input.click();
    await input.fill(term);
    await this.page.locator('[data-testid="search_button"]').click();
  }

}
