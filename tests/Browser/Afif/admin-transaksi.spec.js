import assert from 'node:assert/strict';
import {
  bodyText,
  buildDriver,
  By,
  loginAs,
  url,
  USERS,
  waitForBodyText,
  waitForUrlContains,
} from './helpers/browser.js';
import { clearOrders, seedMultiItemOrder, seedSingleOrder } from './helpers/data.js';
import { installEvidenceHooks } from './helpers/evidence.js';

describe('Afif - Admin Transaksi', function () {
  this.timeout(60000);
  installEvidenceHooks();

  beforeEach(async function () {
    this.driver = await buildDriver();
  });

  afterEach(async function () {
    await this.driver?.quit();
  });

  async function openAdminTransactions(driver) {
    await loginAs(driver, USERS.admin);
    await driver.get(url('/admin/transaksi'));
    await waitForBodyText(driver, /Daftar Transaksi/i);
  }

  it('TC.AT.001.001 - admin melihat daftar transaksi', async function () {
    seedSingleOrder();
    await openAdminTransactions(this.driver);

    const text = await bodyText(this.driver);
    assert.match(text, /Kedai\s+Toko abc/i);
    assert.match(text, /Id Pesanan/i);
    assert.match(text, /Nasi Goreng/i);
    this.test.ctx.actualResult = 'Admin berhasil membuka Daftar Transaksi dan melihat kartu transaksi berisi kedai, ID pesanan, serta item pesanan.';
  });

  it('TC.AT.001.002 - admin melihat empty state saat belum ada transaksi', async function () {
    clearOrders();
    await openAdminTransactions(this.driver);

    const text = await bodyText(this.driver);
    assert.match(text, /Histori Pesanan/i);
    assert.match(text, /Sepertinya kamu belum menyelesaikan\s+pesanan/i);
    this.test.ctx.actualResult = 'Saat data transaksi kosong, halaman menampilkan empty state "Histori Pesanan" dan pesan belum ada pesanan.';
  });

  it('TC.AT.002.001 - admin melihat detail transaksi utama', async function () {
    seedSingleOrder();
    await openAdminTransactions(this.driver);

    const text = await bodyText(this.driver);
    assert.match(text, /Selesai/i);
    assert.match(text, /Harga:\s+Rp 15\.000 x\s+2/i);
    assert.match(text, /Subtotal:\s+Rp 30\.000/i);
    assert.match(text, /Cash/i);
    assert.match(text, /Dine-in/i);
    this.test.ctx.actualResult = 'Detail transaksi menampilkan status, harga x quantity, subtotal, metode pembayaran, dan dine option.';
  });

  it('TC.AT.002.002 - admin membuka item tambahan pada transaksi multi item', async function () {
    seedMultiItemOrder();
    await openAdminTransactions(this.driver);

    const button = await this.driver.findElement(By.xpath("//button[contains(., 'Tampilkan menu lainnya')]"));
    await button.click();
    await waitForBodyText(this.driver, /Mie Ayam/i);

    const text = await bodyText(this.driver);
    assert.match(text, /Nasi Goreng/i);
    assert.match(text, /Mie Ayam/i);
    this.test.ctx.actualResult = 'Tombol "Tampilkan menu lainnya" membuka collapse dan item tambahan "Mie Ayam" terlihat.';
  });

  it('TC.AT.002.003 - admin melihat informasi review transaksi', async function () {
    seedSingleOrder({ withReview: true });
    await openAdminTransactions(this.driver);

    const text = await bodyText(this.driver);
    assert.match(text, /Review:/i);
    assert.match(text, /Rasa enak dan pesanan sesuai/i);
    this.test.ctx.actualResult = 'Bagian Review pada transaksi menampilkan komentar pembeli yang sudah tersimpan.';
  });
});

describe('Afif - Access Control Admin Transaksi', function () {
  this.timeout(60000);
  installEvidenceHooks();

  beforeEach(async function () {
    this.driver = await buildDriver();
  });

  afterEach(async function () {
    await this.driver?.quit();
  });

  it('TC.ATAC.001.001 - buyer tidak dapat mengakses halaman admin transaksi', async function () {
    await loginAs(this.driver, USERS.buyer);
    await this.driver.get(url('/admin/transaksi'));
    await waitForUrlContains(this.driver, '/buyer/dashboard');
    await waitForBodyText(this.driver, /Dashboard|Kamu tidak punya akses/i);

    const currentUrl = await this.driver.getCurrentUrl();
    assert.ok(currentUrl.includes('/buyer/dashboard'));
    this.test.ctx.actualResult = `Buyer diarahkan ke dashboard buyer saat membuka /admin/transaksi (${currentUrl}).`;
  });

  it('TC.ATAC.001.002 - seller tidak dapat mengakses halaman admin transaksi', async function () {
    await loginAs(this.driver, USERS.seller);
    await this.driver.get(url('/admin/transaksi'));
    await waitForUrlContains(this.driver, '/seller/dashboard');
    await waitForBodyText(this.driver, /Dashboard|Kamu tidak punya akses/i);

    const currentUrl = await this.driver.getCurrentUrl();
    assert.ok(currentUrl.includes('/seller/dashboard'));
    this.test.ctx.actualResult = `Seller diarahkan ke dashboard seller saat membuka /admin/transaksi (${currentUrl}).`;
  });

  it('TC.ATAC.001.003 - guest diarahkan ke login saat mengakses halaman admin transaksi', async function () {
    await this.driver.get(url('/admin/transaksi'));
    await waitForUrlContains(this.driver, '/login');
    await waitForBodyText(this.driver, /Login|Email/i);

    const currentUrl = await this.driver.getCurrentUrl();
    assert.ok(currentUrl.includes('/login'));
    this.test.ctx.actualResult = `Guest diarahkan ke halaman login saat membuka /admin/transaksi (${currentUrl}).`;
  });
});
