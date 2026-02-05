// configs/routes.js
import Router from 'koa-router';
import jwt from 'jsonwebtoken';
import { requireAuth, authTrigger } from './middlewares.js';

const router = new Router();
const SECRET_KEY = process.env.JWT_SECRET || 'tu_secreto';

// application
router.post('/api/v1/sign-in', authTrigger, async (ctx) => {
  try {
    console.log('1 +++++++++++++++++++++++++++++++++++')
    console.log(ctx.request.body)
    console.log('2 +++++++++++++++++++++++++++++++++++')

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

export default router;
