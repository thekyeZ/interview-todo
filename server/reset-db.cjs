const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'db.seed.json');
const dbPath = path.join(__dirname, '..', 'db.json');

try {
  fs.copyFileSync(seedPath, dbPath);
  console.log('[db:reset] Pomyślnie przywrócono bazę db.json ze stanu początkowego db.seed.json.');
} catch (error) {
  console.error('[db:reset] Błąd podczas resetowania bazy:', error);
  process.exit(1);
}
