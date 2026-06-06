import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve('tests/Browser/Afif/evidence');
const screenshotDir = path.join(rootDir, 'screenshots');
const resultsPath = path.join(rootDir, 'results.json');

function ensureDirs() {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

function readResults() {
  if (!fs.existsSync(resultsPath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
}

function writeResults(results) {
  fs.writeFileSync(resultsPath, `${JSON.stringify(results, null, 2)}\n`);
}

function tcIdFromTitle(title) {
  const match = title.match(/TC\.[A-Z]+(?:\.[A-Z]+)?\.\d{3}\.\d{3}/);
  if (!match) {
    throw new Error(`TC id not found in title: ${title}`);
  }

  return match[0];
}

export function resetEvidence() {
  fs.rmSync(rootDir, { recursive: true, force: true });
  ensureDirs();
  writeResults({});
}

export function evidenceDir() {
  ensureDirs();
  return rootDir;
}

export function installEvidenceHooks() {
  before(function () {
    ensureDirs();
  });

  afterEach(async function () {
    const test = this.currentTest;
    const driver = this.driver;
    const id = tcIdFromTitle(test.fullTitle());
    const screenshotPath = path.join(screenshotDir, `${id}.png`);
    let screenshotSaved = false;

    if (driver) {
      try {
        const png = await driver.takeScreenshot();
        fs.writeFileSync(screenshotPath, png, 'base64');
        screenshotSaved = true;
      } catch (error) {
        test.ctx.actualResult = `${test.ctx.actualResult || ''} Screenshot gagal dibuat: ${error.message}`.trim();
      }
    }

    const results = readResults();
    const passed = test.state === 'passed';
    const actualResult = passed
      ? (test.ctx.actualResult || 'Skenario berjalan sesuai expected result.')
      : (test.err?.message ? `Actual failure: ${test.err.message}` : 'Skenario gagal.');

    results[id] = {
      id,
      title: test.title,
      status: passed ? 'Pass' : 'Fail',
      actualResult,
      screenshot: screenshotSaved ? screenshotPath : '',
      evidence: screenshotSaved ? `Screenshot: ${screenshotPath}` : 'Screenshot tidak tersedia.',
    };
    writeResults(results);
  });
}
