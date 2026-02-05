// configs/middleware.js
export async function notFoundHandler(ctx) {
  ctx.status = 404;

  ctx.body = {
    success: false,
    message: 'Recurso no encontrado',
    data: null,
    error: 'Error 404'
  };
}

export function errorHandler(err, ctx) {
  console.error('Error:', err.stack || err);

  const statusCode = err.statusCode || 500;

  ctx.status = statusCode;

  ctx.body = {
    success: false,
    message: err.message || 'Error interno del servidor',
    data: null,
    error: `Error ${statusCode}`
  };
  return;
}

export async function requireAuth(ctx, next) {
  ctx.status = 401;
  ctx.body = {
    success: false,
    message: 'Acceso no autorizado',
    data: null,
    error: 'Error 401: No autenticado'
  };
  return;
}

export const headers = async (ctx, next) => {
  ctx.set('X-Powered-By', 'Koa'); // Agregar una cabecera personalizada
  ctx.set('Server', 'Ubuntu'); // Identificar el servidor

  // Permitir CORS
  /*
  ctx.set('Access-Control-Allow-Origin', '*'); // Permitir todas las origenes; ajusta según tus necesidades
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Métodos permitidos
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Encabezados permitidos

  // Manejo de OPTIONS
  if (ctx.method === 'OPTIONS') {
    ctx.status = 204; // No content
    return;
  }*/

  await next(); // Continuar con la siguiente función middleware o ruta
};

export const authTrigger = async (ctx, next) => {
  const authHeader = ctx.get('X-Auth-Trigger'); // obtiene el header
  const expectedAuth = process.env.AUTH_HEADER;

  console.log('1 +++++++++++++++++++++++++++');
  console.log(authHeader);
  console.log(expectedAuth);
  console.log('2 +++++++++++++++++++++++++++');

  // Validar existencia y valor
  if (!authHeader || authHeader !== expectedAuth) {
    ctx.status = 401;
    ctx.body = {
      success: false,
      message: 'Acceso no autorizado',
      data: null,
      error: 'Error 401: No autenticado'
    };
    return;
  }

  // Si todo está OK, continúa
  await next();
};
