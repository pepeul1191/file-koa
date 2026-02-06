// configs/routes.js
import Router from 'koa-router';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';

import { requireAuth, authTrigger } from './middlewares.js';
import { randomFileName } from './helpers.js';

// helpers para __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = new Router();
const SECRET_KEY = process.env.JWT_SECRET || 'tu_secreto';

// application
router.post('/api/v1/sign-in', authTrigger, async (ctx) => {
  try {
    const { user, roles } = ctx.request.body;

    const fileManagerRole = roles.find(
      role => role.name === 'file-manager'
    );

    // ❌ Si no existe el rol → error
    if (!fileManagerRole) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        message: 'El usuario no tiene el rol file-manager',
        data: null,
        error: 'ROLE_NOT_FOUND'
      };
      return;
    }

    const permissions = fileManagerRole.permissions;

    const token = jwt.sign(
      {
        user,
        permissions
      },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    ctx.body = {
      success: true,
      message: 'Login exitoso',
      data: token,
      error: null
    };

  } catch (error) {
    console.error(error);
    ctx.status = error.status || 500;
    ctx.body = {
      success: false,
      message: error.message || 'Error interno del servidor',
      data: null,
      error: error.message
    };
  }
});

router.get('/api/v1/token/translate', authTrigger, async (ctx) => {
  try {
    const authHeader = ctx.headers.authorization;

    if (!authHeader) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: 'Token no proporcionado',
      };
      return;
    }

    // Quitamos "Bearer "
    const token = authHeader.split(' ')[1];

    if (!token) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: 'Formato de token inválido',
      };
      return;
    }

    // 🔐 Verificamos y decodificamos
    const decoded = jwt.verify(token, SECRET_KEY);

    ctx.status = 200;
    ctx.body = {
      success: true,
      message: 'Token válido',
      data: decoded, // ← payload del JWT
    };

  } catch (error) {
    ctx.status = 401;
    ctx.body = {
      success: false,
      message: 'Token inválido o expirado',
      error: error.message,
    };
  }
});

router.post('/api/v1/public', async (ctx) => {
  try {
    const { folder } = ctx.request.body;
    const file = ctx.request.files?.file;

    if (!folder) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'La llave folder es obligatoria',
        data: null,
        error: 'FOLDER_REQUIRED'
      };
      return;
    }

    if (!file) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'No se recibió ningún archivo',
        data: null,
        error: 'FILE_REQUIRED'
      };
      return;
    }

    // ruta base /public
    const publicPath = path.join(__dirname, '../public');
    const folderPath = path.join(publicPath, folder);

    // crear folder si no existe
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // extensión original
    const originalName = file.originalFilename;
    const ext = path.extname(originalName);

    // nuevo nombre
    const newFileName = `${randomFileName(30)}${ext}`;
    const finalPath = path.join(folderPath, newFileName);

    // mover archivo
    await pipeline(
      fs.createReadStream(file.filepath),
      fs.createWriteStream(finalPath)
    );

    await fs.promises.unlink(file.filepath);

    ctx.status = 200;
    ctx.body = {
      success: true,
      message: 'Archivo subido correctamente',
      data: {
        folder,
        filename: newFileName
      },
      error: null
    };

  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'Error al subir el archivo',
      data: null,
      error: error.message
    };
  }
});

export default router;
