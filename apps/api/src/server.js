require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const app = require('./app');
const mongoose = require('mongoose');
const { connectDatabase } = require('./config/database');

const port = Number(process.env.PORT) || 4000;

async function handleStartupError(error) {
  if (error.code === 'EADDRINUSE') {
    console.error(`No se pudo iniciar la API: el puerto ${port} ya está ocupado. Detén la instancia anterior con Ctrl+C en su terminal antes de iniciar otra.`);
  } else {
    console.error('No fue posible iniciar la API:', error.message);
  }
  await mongoose.disconnect();
  process.exitCode = 1;
}

connectDatabase()
  .then(() => app.listen(port, '0.0.0.0', () => console.log(`API lista en el puerto ${port}`)).on('error', handleStartupError))
  .catch(handleStartupError);
