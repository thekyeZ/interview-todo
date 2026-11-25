const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'db.seed.json');
const dbPath = path.join(__dirname, '..', 'db.json');

try {
  fs.copyFileSync(seedPath, dbPath);
  console.log('[db:reset] Restored db.json from db.seed.json.');
} catch (error) {
  console.error('[db:reset] Failed to reset database:', error);
  process.exit(1);
}
