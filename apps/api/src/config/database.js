const mongoose = require('mongoose');

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Falta definir MONGODB_URI. Copia .env.example a .env y configúrala.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB conectado: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

module.exports = { connectDatabase };
