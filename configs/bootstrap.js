// configs/bootstrap.js
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import morgan from 'koa-morgan';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';

import appRoutes from './routes.js';
import { notFoundHandler, errorHandler, headers } from './middlewares.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function bootstrap(app) {
  /* ======================
     Config base
  ====================== */
  app.keys = [
    process.env.SESSION_SECRET ||
    'secreto-super-seguro-cambiar-en-produccion'
  ];

  /* ======================
     Logs y headers
  ====================== */
  app.use(morgan('dev'));
  app.use(headers);

  /* ======================
     Body parsers
  ====================== */
  app.use(bodyParser());

  /* ======================
     Archivos estáticos
  ====================== */
  app.use(serve(
    path.join(__dirname, '../public')
  ));

  /* ======================
     Variables globales
  ====================== */
  app.context.siteTitle =
    process.env.SITE_TITLE || 'Mi sitio web';

  app.context.adminEmail =
    process.env.ADMIN_EMAIL || 'admin@ejemplo.com';

  /* ======================
     Rutas
  ====================== */
  app.use(appRoutes.routes());
  app.use(appRoutes.allowedMethods());

  /* ======================
     404 + errores
  ====================== */
  app.use(notFoundHandler);
  app.on('error', errorHandler);
}
