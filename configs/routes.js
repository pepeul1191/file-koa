// configs/routes.js
import Router from 'koa-router';
import jwt from 'jsonwebtoken';
import { requireAuth, authTrigger } from './middlewares.js';

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


export default router;
