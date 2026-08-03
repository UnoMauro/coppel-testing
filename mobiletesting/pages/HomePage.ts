import { BasePage } from './BasePage';

export class HomePage extends BasePage {

  async goto() {
    await super.goto('/');
  }

  async search(term: string) {
    const input = this.driver.$('[data-testid="search_inputfield"]');
    await input.waitForDisplayed({ timeout: 30000 });
    await input.click();
    await input.setValue(term);

    // `[data-testid="search_button"]` es el botón de la variante desktop:
    // en el viewport mobile el layout responsive lo deja con width/height 0
    // (no está oculto con display:none, solo colapsado), así que WebDriver
    // lo reporta como "not interactable" y un .click() normal falla. Se
    // dispara la búsqueda con la acción "search" del teclado en pantalla,
    // que es como lo haría un usuario real en un teclado móvil.
    await this.driver.execute('mobile: performEditorAction', { action: 'search' });
  }

}
