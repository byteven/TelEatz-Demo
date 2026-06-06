import assert from 'node:assert/strict';
import {
  bodyText,
  buildDriver,
  loginAs,
  selectByValue,
  setInputValue,
  submitNearestForm,
  tableColumnTexts,
  tableRows,
  url,
  USERS,
  waitForBodyText,
  By,
} from './helpers/browser.js';
import { ensureUnverifiedBuyer } from './helpers/data.js';
import { installEvidenceHooks } from './helpers/evidence.js';

describe('Afif - Kelola User', function () {
  this.timeout(60000);
  installEvidenceHooks();

  beforeEach(async function () {
    this.driver = await buildDriver();
    await loginAs(this.driver, USERS.admin);
    await this.driver.get(url('/admin/kelolauser'));
    await waitForBodyText(this.driver, /Kelola Akun User/i);
  });

  afterEach(async function () {
    await this.driver?.quit();
  });

  it('TC.KU.006.001 - admin mencari user berdasarkan nama', async function () {
    await setInputValue(this.driver, 'input[name="search"]', 'vio salman');
    await submitNearestForm(this.driver, 'input[name="search"]');
    await waitForBodyText(this.driver, /vio salman/i);

    const text = await bodyText(this.driver);
    assert.match(text, /vio@gmail\.com/i);
    this.test.ctx.actualResult = 'Halaman Kelola User menampilkan user "vio salman" dan email "vio@gmail.com" setelah pencarian nama.';
  });

  it('TC.KU.006.002 - admin mencari user berdasarkan email', async function () {
    await setInputValue(this.driver, 'input[name="search"]', 'abc@gmail.com');
    await submitNearestForm(this.driver, 'input[name="search"]');
    await waitForBodyText(this.driver, /abc@gmail\.com/i);

    const text = await bodyText(this.driver);
    assert.match(text, /Toko abc/i);
    this.test.ctx.actualResult = 'Halaman Kelola User menampilkan user "Toko abc" saat pencarian menggunakan email.';
  });

  it('TC.KU.006.003 - admin mencari user yang tidak tersedia', async function () {
    await setInputValue(this.driver, 'input[name="search"]', 'user-tidak-ada-teleatz');
    await submitNearestForm(this.driver, 'input[name="search"]');
    await waitForBodyText(this.driver, /Tidak ada user terdaftar/i);

    this.test.ctx.actualResult = 'Halaman menampilkan pesan "Tidak ada user terdaftar." untuk keyword yang tidak memiliki hasil.';
  });

  it('TC.KU.007.001 - admin filter role buyer', async function () {
    await selectByValue(this.driver, 'select[name="role"]', 'buyer');
    await submitNearestForm(this.driver, 'select[name="role"]');
    await waitForBodyText(this.driver, /vio salman/i);

    const roles = await tableColumnTexts(this.driver, 2);
    assert.ok(roles.length > 0, 'Buyer rows should be visible');
    assert.ok(roles.every((role) => role.toLowerCase() === 'buyer'));
    this.test.ctx.actualResult = `Filter role buyer aktif dan seluruh baris tabel yang tampil memiliki role buyer (${roles.length} baris).`;
  });

  it('TC.KU.007.002 - admin filter role seller', async function () {
    await selectByValue(this.driver, 'select[name="role"]', 'seller');
    await submitNearestForm(this.driver, 'select[name="role"]');
    await waitForBodyText(this.driver, /Toko abc/i);

    const roles = await tableColumnTexts(this.driver, 2);
    assert.ok(roles.length > 0, 'Seller rows should be visible');
    assert.ok(roles.every((role) => role.toLowerCase() === 'seller'));
    this.test.ctx.actualResult = `Filter role seller aktif dan seluruh baris tabel yang tampil memiliki role seller (${roles.length} baris).`;
  });

  it('TC.KU.008.001 - admin filter user terverifikasi', async function () {
    await selectByValue(this.driver, 'select[name="verified"]', '1');
    await submitNearestForm(this.driver, 'select[name="verified"]');
    await waitForBodyText(this.driver, /Verified/i);

    const verifiedValues = await tableColumnTexts(this.driver, 3);
    assert.ok(verifiedValues.length > 0, 'Verified rows should be visible');
    assert.ok(verifiedValues.every((value) => /Verified/i.test(value) && !/Not Verified/i.test(value)));
    this.test.ctx.actualResult = `Filter status terverifikasi aktif dan seluruh baris tabel yang tampil berstatus Verified (${verifiedValues.length} baris).`;
  });

  it('TC.KU.008.002 - admin filter user belum verifikasi', async function () {
    ensureUnverifiedBuyer();
    await this.driver.navigate().refresh();
    await selectByValue(this.driver, 'select[name="verified"]', '0');
    await submitNearestForm(this.driver, 'select[name="verified"]');
    await waitForBodyText(this.driver, /Not Verified/i);

    const verifiedValues = await tableColumnTexts(this.driver, 3);
    assert.ok(verifiedValues.length > 0, 'Unverified rows should be visible');
    assert.ok(verifiedValues.every((value) => /Not Verified/i.test(value)));
    this.test.ctx.actualResult = `Filter status belum verifikasi aktif dan seluruh baris tabel yang tampil berstatus Not Verified (${verifiedValues.length} baris).`;
  });

  it('TC.KU.009.001 - admin reset filter dan search', async function () {
    await selectByValue(this.driver, 'select[name="role"]', 'buyer');
    await submitNearestForm(this.driver, 'select[name="role"]');
    await waitForBodyText(this.driver, /vio salman/i);

    await this.driver.findElement(By.css('a.btn.btn-secondary')).click();
    await waitForBodyText(this.driver, /admin@gmail\.com/i);

    const rows = await tableRows(this.driver);
    const text = await bodyText(this.driver);
    assert.ok(rows.length >= 3, 'Reset should show multiple users again');
    assert.match(text, /Toko abc/i);
    this.test.ctx.actualResult = 'Tombol Reset menghapus parameter filter/search dan tabel kembali menampilkan user lintas role, termasuk admin dan seller.';
  });
});
