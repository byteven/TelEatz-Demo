import assert from 'node:assert/strict';
import {
  bodyText,
  buildDriver,
  By,
  url,
  waitForBodyText,
  waitForUrlContains,
} from './helpers/browser.js';
import { removeVisibleProducts, restoreProducts } from './helpers/data.js';
import { installEvidenceHooks } from './helpers/evidence.js';

describe('Afif - Landing Page', function () {
  this.timeout(60000);
  installEvidenceHooks();

  beforeEach(async function () {
    restoreProducts();
    this.driver = await buildDriver();
  });

  afterEach(async function () {
    await this.driver?.quit();
  });

  it('TC.LP.001.001 - user mengakses landing page dari root URL', async function () {
    await this.driver.get(url('/'));
    await waitForBodyText(this.driver, /Welcome to\s+TelEatz/i);

    const text = await bodyText(this.driver);
    assert.match(text, /Tentang Kami/i);
    assert.match(text, /Menu Makanan Populer/i);
    this.test.ctx.actualResult = 'Root URL menampilkan landing page dengan hero TelEatz, section Tentang Kami, dan section Menu Makanan Populer.';
  });

  it('TC.LP.001.002 - route /landing redirect ke root landing page', async function () {
    await this.driver.get(url('/landing'));
    await waitForBodyText(this.driver, /Welcome to\s+TelEatz/i);

    const currentUrl = await this.driver.getCurrentUrl();
    assert.equal(new URL(currentUrl).pathname, '/');
    this.test.ctx.actualResult = `Route /landing berhasil redirect ke root landing page (${currentUrl}).`;
  });

  it('TC.LP.002.001 - navigasi Home About Features tersedia dan menuju section yang sesuai', async function () {
    await this.driver.get(url('/'));
    await waitForBodyText(this.driver, /Welcome to\s+TelEatz/i);

    await this.driver.findElement(By.css('a[href="#about"]')).click();
    await waitForUrlContains(this.driver, '#about');
    await waitForBodyText(this.driver, /Apa itu\s+TelEatz/i);

    await this.driver.findElement(By.css('a[href="#features"]')).click();
    await waitForUrlContains(this.driver, '#features');
    await waitForBodyText(this.driver, /Menu Makanan Populer/i);

    this.test.ctx.actualResult = 'Link About dan Features pada navbar aktif dan mengarahkan user ke section landing page yang sesuai.';
  });

  it('TC.LP.002.002 - tombol Login pada landing page membuka halaman login', async function () {
    await this.driver.get(url('/'));
    await waitForBodyText(this.driver, /Welcome to\s+TelEatz/i);

    await this.driver.findElement(By.css('a[href$="/login"]')).click();
    await waitForUrlContains(this.driver, '/login');
    await waitForBodyText(this.driver, /Email|Login/i);

    const currentUrl = await this.driver.getCurrentUrl();
    this.test.ctx.actualResult = `Tombol Login pada landing page membuka halaman login (${currentUrl}).`;
  });

  it('TC.LP.003.001 - landing page menampilkan menu populer saat produk tersedia', async function () {
    await this.driver.get(url('/'));
    await waitForBodyText(this.driver, /Menu Makanan Populer/i);

    const buttons = await this.driver.findElements(By.xpath("//a[contains(., 'Pesan') and contains(., 'Sekarang')]"));
    assert.ok(buttons.length > 0, 'Popular menu order buttons should be visible');
    this.test.ctx.actualResult = `Section Menu Makanan Populer menampilkan kartu produk dengan tombol Pesan Sekarang (${buttons.length} tombol terlihat).`;
  });

  it('TC.LP.003.002 - landing page menampilkan empty state saat produk kosong', async function () {
    removeVisibleProducts();
    await this.driver.get(url('/'));
    await waitForBodyText(this.driver, /Belum ada produk tersedia/i);

    const text = await bodyText(this.driver);
    assert.match(text, /Menu Makanan Populer/i);
    assert.match(text, /Belum ada produk tersedia/i);
    this.test.ctx.actualResult = 'Saat tidak ada produk aktif, section Menu Makanan Populer menampilkan pesan "Belum ada produk tersedia.".';
  });
});
