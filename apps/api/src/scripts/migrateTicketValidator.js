const path = require('node:path');
const fs = require('node:fs/promises');
const { isDeepStrictEqual } = require('node:util');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');
const { upgradeTicketValidator } = require('../config/ticketValidator');

async function migrate() {
  await connectDatabase();
  const db = mongoose.connection.db;
  const collection = 'incidencias_campus';
  const [info] = await db.listCollections({ name: collection }).toArray();
  if (!info) throw new Error('No existe la colección incidencias_campus.');
  const previous = info.options.validator || {};
  const validator = upgradeTicketValidator(previous);
  if (isDeepStrictEqual(previous, validator) &&
      info.options.validationLevel === 'strict' && info.options.validationAction === 'error') {
    console.log('El validador de incidencias ya está actualizado.');
    return;
  }
  const backupDir = path.resolve(__dirname, '../../.validator-backups');
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `${collection}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await fs.writeFile(backupPath, JSON.stringify({
    database: db.databaseName,
    restoreCommand: {
      collMod: collection,
      validator: previous,
      validationLevel: info.options.validationLevel || 'strict',
      validationAction: info.options.validationAction || 'error'
    }
  }, null, 2), { flag: 'wx' });
  console.log(`Respaldo del validador anterior: ${backupPath}`);
  await db.command({ collMod: collection, validator, validationLevel: 'strict', validationAction: 'error' });
  console.log('Validador actualizado. Se conservan los documentos existentes y la validación estricta.');
}

migrate().catch(error => {
  console.error('No se pudo actualizar el validador:', error.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
