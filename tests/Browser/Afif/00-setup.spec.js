import { resetDatabase } from './helpers/data.js';
import { resetEvidence } from './helpers/evidence.js';

describe('Afif E2E setup', function () {
  this.timeout(120000);

  before(function () {
    resetEvidence();
    resetDatabase();
  });

  it('prepares the database and evidence directory', function () {
    // Keeps Mocha output explicit that setup was executed.
  });
});
