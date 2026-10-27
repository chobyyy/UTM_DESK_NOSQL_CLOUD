const mongoose = require('mongoose');
const dns = require('dns');

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Falta definir MONGODB_URI. Copia .env.example a .env y configúrala.');
  }

  const dnsServers = process.env.MONGODB_DNS_SERVERS?.split(',').map((server) => server.trim()).filter(Boolean);
  if (dnsServers?.length) dns.setServers(dnsServers);
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: false
  });
  console.log(`MongoDB conectado: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

module.exports = { connectDatabase };
