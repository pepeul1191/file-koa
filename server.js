// server.js
import Koa from 'koa';
import bootstrap from './configs/bootstrap.js';

const app = new Koa();

// Inicializa toda la app
await bootstrap(app);

// Levanta el servidor
const PORT = process.env.PORT || 5010;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
