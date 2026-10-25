require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDatabase } = require('../config/database');
const { User } = require('../models/User');

const password = process.env.DEMO_PASSWORD || 'seguraUTM2026';
const users = [
  ['Ana Sofía García Mendoza', 'alumno.garcia@utm.edu.mx', 'reportante', ['computo_redes']],
  ['Ing. Roberto Juárez Pérez', 'ing.roberto.juarez@utm.edu.mx', 'tecnico', ['computo_redes']],
  ['Ing. Pedro Ruíz Zárate', 'ing.pedro.ruiz@utm.edu.mx', 'tecnico', ['infraestructura']],
  ['Mtra. Elena Morales Ramos', 'coord.redes@utm.edu.mx', 'coordinador', ['computo_redes']],
  ['Administrador General UTM', 'admin.dti@utm.edu.mx', 'administrador', ['computo_redes', 'infraestructura', 'academico']]
];

async function seed() {
  await connectDatabase();
  const passwordHash = await bcrypt.hash(password, 12);
  await Promise.all(users.map(([nombre, correo, rol, areas_autorizadas]) => User.findOneAndUpdate(
    { correo }, { nombre, correo, rol, areas_autorizadas, activo: true, passwordHash }, { upsert: true, new: true, setDefaultsOnInsert: true }
  )));
  console.log('Usuarios de demostración creados o actualizados.');
  process.exit(0);
}
seed().catch((error) => { console.error(error); process.exit(1); });
