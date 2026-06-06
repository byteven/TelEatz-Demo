import 'chromedriver';
import { Builder, By, Key, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

export const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8000';

export const USERS = {
  admin: { email: 'admin@gmail.com', password: '12345', dashboardPath: '/admin/dashboard' },
  seller: { email: 'abc@gmail.com', password: '12345', dashboardPath: '/seller/dashboard' },
  buyer: { email: 'vio@gmail.com', password: '12345', dashboardPath: '/buyer/dashboard' },
};

export async function buildDriver() {
  const options = new chrome.Options();

  if (process.env.HEADLESS !== 'false') {
    options.addArguments('--headless=new');
  }

  options.addArguments('--window-size=1366,900');
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');

  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

export function url(path) {
  return new URL(path, BASE_URL).toString();
}

export async function waitForUrlContains(driver, expectedPath, timeout = 10000) {
  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    return currentUrl.includes(expectedPath);
  }, timeout, `Expected current URL to contain "${expectedPath}"`);
}

export async function waitForBodyText(driver, pattern, timeout = 10000) {
  await driver.wait(async () => {
    try {
      const text = await driver.findElement(By.css('body')).getText();
      return pattern.test(text);
    } catch {
      return false;
    }
  }, timeout, `Expected page body to match ${pattern}`);
}

export async function bodyText(driver) {
  return driver.findElement(By.css('body')).getText();
}

export async function setInputValue(driver, selector, value) {
  const input = await driver.findElement(By.css(selector));
  await input.clear();
  await input.sendKeys(value);
}

export async function selectByValue(driver, selector, value) {
  const select = await driver.findElement(By.css(selector));
  await select.click();
  await select.findElement(By.css(`option[value="${value}"]`)).click();
}

export async function submitNearestForm(driver, selector) {
  await driver.executeScript(`
    const element = document.querySelector(arguments[0]);
    if (!element) throw new Error('Element not found: ' + arguments[0]);
    const form = element.closest('form');
    if (!form) throw new Error('Nearest form not found for: ' + arguments[0]);
    form.requestSubmit ? form.requestSubmit() : form.submit();
  `, selector);
}

export async function tableRows(driver) {
  return driver.findElements(By.css('table tbody tr'));
}

export async function tableColumnTexts(driver, columnIndex) {
  const rows = await tableRows(driver);
  const values = [];

  for (const row of rows) {
    const cells = await row.findElements(By.css('td'));
    if (cells.length > columnIndex) {
      values.push((await cells[columnIndex].getText()).trim());
    }
  }

  return values;
}

export { By, Key, until };

export async function loginAs(driver, user) {
  await driver.get(url('/login'));
  await driver.wait(until.elementLocated(By.css('input[name="email"]')), 10000);
  await driver.findElement(By.css('input[name="email"]')).clear();
  await driver.findElement(By.css('input[name="email"]')).sendKeys(user.email);
  await driver.findElement(By.css('input[name="password"]')).clear();
  await driver.findElement(By.css('input[name="password"]')).sendKeys(user.password);
  await driver.findElement(By.css('button[type="submit"]')).click();
  await waitForUrlContains(driver, user.dashboardPath);
}

export async function logoutViaForm(driver) {
  await driver.executeScript(`
    const form = document.querySelector('form[action$="/logout"]');
    if (!form) throw new Error('Logout form not found');
    form.submit();
  `);
  await waitForUrlContains(driver, '/login');
}
