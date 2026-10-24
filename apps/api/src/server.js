require('dotenv').config();
const app = require('./app');
const { connectDatabase } = require('./config/database');

const port = Number(process.env.PORT) || 4000;

connectDatabase()
  .then(() => app.listen(port, '0.0.0.0', () => console.log(`API lista en el puerto ${port}`)))
  .catch((error) => {
    console.error('No fue posible iniciar la API:', error.message);
    process.exit(1);
  });
