import type { Browser } from 'webdriverio';

export class BasePage {

  readonly driver: Browser;

  constructor(driver: Browser) {
    this.driver = driver;
  }

  async goto(path: string = '/') {
    await this.driver.url(path);
    await this.dismissPopups();
  }

  // Igual que en el suite desktop (pages/BasePage.ts): el banner de cookies
  // aparece poco después de cargar, no de forma instantánea, y no siempre en
  // cada sesión -- se cierra "best effort" con un timeout corto, sin fallar
  // si nunca aparece.
  //
  // El botón de cerrar no tiene texto visible (solo un ícono SVG,
  // aria-label="Close") -- un selector CSS por atributo es una sola
  // consulta, sin tener que recorrer todos los <button> de la página
  // comparando texto uno por uno (~25s en este stack con el selector
  // '=texto' de WebdriverIO).
  async dismissPopups() {
    const cookieClose = this.driver.$('button[aria-label="Close"]');
    if (await cookieClose.waitForExist({ timeout: 3000 }).catch(() => false)) {
      await cookieClose.click().catch(() => {});
    }
  }

}
