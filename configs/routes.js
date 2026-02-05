// configs/routes.js
import Router from 'koa-router';
import { requireAuth, authTrigger } from './middlewares.js';

const router = new Router();

// application
router.get('/', async (ctx) => {
  try {
    ctx.body = {
      success: true,
      message: 'hola mudo',
      data: ':)',
      error: '',
    };
  } catch (error) {
    console.error(error);
    ctx.status = error.status || 500;
    ctx.body = {
      success: false,
      message: error.message || 'Error interno del servidor',
      data: null,
      error: error.message,
    };
  }
});

export default router;
