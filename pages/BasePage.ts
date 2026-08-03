import { Page } from '@playwright/test';

export class BasePage {

  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // 'domcontentloaded' en vez del 'load' por defecto: Coppel carga muchos
  // scripts de terceros (trackers, ads) que a veces nunca terminan de
  // cargar, y el evento 'load' no dispara hasta que TODO termina -- aunque
  // la página ya esté completamente usable, causando timeouts falsos.
  async goto(path: string = '/') {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    await this.dismissPopups();
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  // Coppel muestra un modal de "elige tu ciudad" y un banner de cookies poco
  // después de cargar la página (no de forma instantánea), y no siempre
  // aparecen en cada sesión, así que se cierran "best effort" con un timeout
  // corto en vez de un chequeo instantáneo, sin fallar si nunca aparecen.
  async dismissPopups() {
    const cookieClose = this.page.getByRole('button', { name: 'Close', exact: true });
    await cookieClose.click({ timeout: 3000 }).catch(() => {});

    const locationClose = this.page.getByRole('dialog').getByRole('button', { name: 'Cerrar' });
    await locationClose.click({ timeout: 3000 }).catch(() => {});
  }

}
