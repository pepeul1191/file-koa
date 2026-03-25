import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper para obtener la ruta base según el destino
 */
const getBasePath = (destination) => {
  if (destination === 'public') {
    return path.join(__dirname, '../public');
  } else if (destination === 'storage') {
    return path.join(__dirname, '../storage');
  } else {
    throw new Error('Destination must be "public" or "storage"');
  }
};

/**
 * Helper para obtener ruta relativa
 */
const getRelativePath = (absolutePath, destination) => {
  const basePath = getBasePath(destination);
  return path.relative(basePath, absolutePath);
};

/**
 * Helper para validar nombres de carpetas (evitar path traversal)
 */
const isValidFolderName = (name) => {
  if (!name) return false;
  // Permitir solo caracteres alfanuméricos, guiones, guiones bajos y puntos
  // Pero evitar secuencias peligrosas como '..'
  if (name.includes('..')) return false;
  if (name.includes('/') || name.includes('\\')) return false;
  // Evitar nombres vacíos o solo puntos
  if (name === '.' || name === '') return false;
  return true;
};

/**
 * Helper para construir ruta anidada
 */
const buildNestedPath = (basePath, folderPath) => {
  // folderPath puede ser "carpeta1/subcarpeta2/subcarpeta3"
  const segments = folderPath.split('/').filter(segment => segment.trim() !== '');
  return path.join(basePath, ...segments);
};

/**
 * POST /api/v1/folder
 * Crear una carpeta en la raíz de public o storage
 */
export const createFolder = async (ctx) => {
  try {
    const { name, destination } = ctx.request.body;

    // Validaciones
    if (!name) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El nombre de la carpeta es obligatorio',
        data: null,
        error: 'FOLDER_NAME_REQUIRED'
      };
      return;
    }

    if (!destination || (destination !== 'public' && destination !== 'storage')) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El destino debe ser "public" o "storage"',
        data: null,
        error: 'INVALID_DESTINATION'
      };
      return;
    }

    // Evitar path traversal
    if (!isValidFolderName(name)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El nombre de la carpeta contiene caracteres inválidos',
        data: null,
        error: 'INVALID_FOLDER_NAME'
      };
      return;
    }

    const basePath = getBasePath(destination);
    const folderPath = path.join(basePath, name);
    const relativePath = getRelativePath(folderPath, destination);

    // Verificar si la carpeta ya existe
    if (fs.existsSync(folderPath)) {
      ctx.status = 409; // Conflict
      ctx.body = {
        success: false,
        message: 'La carpeta ya existe',
        data: null,
        error: 'FOLDER_ALREADY_EXISTS'
      };
      return;
    }

    // Crear la carpeta
    fs.mkdirSync(folderPath, { recursive: true });

    ctx.status = 201;
    ctx.body = {
      success: true,
      message: 'Carpeta creada correctamente',
      data: {
        name,
        destination,
        path: relativePath  // ← Ruta relativa
      },
      error: null
    };

  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'Error al crear la carpeta',
      data: null,
      error: error.message
    };
  }
};

/**
 * POST /api/v1/sub-folder
 * Crear subcarpetas anidadas (soporta múltiples niveles)
 * Ejemplo: "cursos/2024/matematical/recursos"
 */
export const createSubFolder = async (ctx) => {
  try {
    let { path: folderPath, destination } = ctx.request.body;

    // Validaciones
    if (!folderPath) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'La ruta de la carpeta es obligatoria',
        data: null,
        error: 'FOLDER_PATH_REQUIRED'
      };
      return;
    }

    if (!destination || (destination !== 'public' && destination !== 'storage')) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El destino debe ser "public" o "storage"',
        data: null,
        error: 'INVALID_DESTINATION'
      };
      return;
    }

    // Limpiar la ruta (eliminar slashes al inicio y final)
    folderPath = folderPath.replace(/^\/+|\/+$/g, '');
    
    // Validar cada segmento de la ruta
    const segments = folderPath.split('/');
    for (const segment of segments) {
      if (!isValidFolderName(segment)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: `El segmento "${segment}" contiene caracteres inválidos`,
          data: null,
          error: 'INVALID_FOLDER_NAME'
        };
        return;
      }
    }

    const basePath = getBasePath(destination);
    const fullPath = buildNestedPath(basePath, folderPath);
    const relativePath = getRelativePath(fullPath, destination);

    // Verificar si la carpeta ya existe
    if (fs.existsSync(fullPath)) {
      ctx.status = 409; // Conflict
      ctx.body = {
        success: false,
        message: 'La carpeta ya existe',
        data: null,
        error: 'FOLDER_ALREADY_EXISTS'
      };
      return;
    }

    // Crear la carpeta y todas las carpetas padre necesarias
    fs.mkdirSync(fullPath, { recursive: true });

    ctx.status = 201;
    ctx.body = {
      success: true,
      message: 'Carpeta(s) creada(s) correctamente',
      data: {
        path: relativePath,  // ← Ruta relativa
        destination,
        segments
      },
      error: null
    };

  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'Error al crear la carpeta',
      data: null,
      error: error.message
    };
  }
};

/**
 * PUT /api/v1/folder
 * Renombrar una carpeta existente
 */
export const renameFolder = async (ctx) => {
  try {
    const { oldName, newName, destination } = ctx.request.body;

    // Validaciones
    if (!oldName) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El nombre actual de la carpeta es obligatorio',
        data: null,
        error: 'OLD_NAME_REQUIRED'
      };
      return;
    }

    if (!newName) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El nuevo nombre de la carpeta es obligatorio',
        data: null,
        error: 'NEW_NAME_REQUIRED'
      };
      return;
    }

    if (!destination || (destination !== 'public' && destination !== 'storage')) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El destino debe ser "public" o "storage"',
        data: null,
        error: 'INVALID_DESTINATION'
      };
      return;
    }

    // Evitar path traversal
    if (!isValidFolderName(oldName) || !isValidFolderName(newName)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'Los nombres contienen caracteres inválidos',
        data: null,
        error: 'INVALID_FOLDER_NAME'
      };
      return;
    }

    const basePath = getBasePath(destination);
    const oldPath = path.join(basePath, oldName);
    const newPath = path.join(basePath, newName);
    const relativePath = getRelativePath(newPath, destination);

    // Verificar si la carpeta original existe
    if (!fs.existsSync(oldPath)) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: 'La carpeta no existe',
        data: null,
        error: 'FOLDER_NOT_FOUND'
      };
      return;
    }

    // Verificar si ya existe una carpeta con el nuevo nombre
    if (fs.existsSync(newPath)) {
      ctx.status = 409;
      ctx.body = {
        success: false,
        message: 'Ya existe una carpeta con el nuevo nombre',
        data: null,
        error: 'FOLDER_ALREADY_EXISTS'
      };
      return;
    }

    // Renombrar la carpeta
    fs.renameSync(oldPath, newPath);

    ctx.status = 200;
    ctx.body = {
      success: true,
      message: 'Carpeta renombrada correctamente',
      data: {
        oldName,
        newName,
        destination,
        path: relativePath  // ← Ruta relativa
      },
      error: null
    };

  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'Error al renombrar la carpeta',
      data: null,
      error: error.message
    };
  }
};

/**
 * PUT /api/v1/sub-folder
 * Renombrar una subcarpeta anidada
 * Permite renombrar carpetas en cualquier nivel de profundidad
 */
export const renameSubFolder = async (ctx) => {
  try {
    let { path: folderPath, newName, destination } = ctx.request.body;

    // Validaciones
    if (!folderPath) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'La ruta de la carpeta es obligatoria',
        data: null,
        error: 'FOLDER_PATH_REQUIRED'
      };
      return;
    }

    if (!newName) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El nuevo nombre de la carpeta es obligatorio',
        data: null,
        error: 'NEW_NAME_REQUIRED'
      };
      return;
    }

    if (!destination || (destination !== 'public' && destination !== 'storage')) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El destino debe ser "public" o "storage"',
        data: null,
        error: 'INVALID_DESTINATION'
      };
      return;
    }

    // Limpiar la ruta
    folderPath = folderPath.replace(/^\/+|\/+$/g, '');
    
    // Validar cada segmento de la ruta
    const segments = folderPath.split('/');
    for (const segment of segments) {
      if (!isValidFolderName(segment)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: `El segmento "${segment}" contiene caracteres inválidos`,
          data: null,
          error: 'INVALID_FOLDER_NAME'
        };
        return;
      }
    }

    // Validar el nuevo nombre
    if (!isValidFolderName(newName)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El nuevo nombre contiene caracteres inválidos',
        data: null,
        error: 'INVALID_FOLDER_NAME'
      };
      return;
    }

    const basePath = getBasePath(destination);
    const oldPath = buildNestedPath(basePath, folderPath);
    
    // Obtener el directorio padre y construir la nueva ruta
    const parentDir = path.dirname(oldPath);
    const newPath = path.join(parentDir, newName);
    const relativePath = getRelativePath(newPath, destination);

    // Verificar si la carpeta original existe
    if (!fs.existsSync(oldPath)) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: 'La carpeta no existe',
        data: null,
        error: 'FOLDER_NOT_FOUND'
      };
      return;
    }

    // Verificar si ya existe una carpeta con el nuevo nombre
    if (fs.existsSync(newPath)) {
      ctx.status = 409;
      ctx.body = {
        success: false,
        message: 'Ya existe una carpeta con el nuevo nombre',
        data: null,
        error: 'FOLDER_ALREADY_EXISTS'
      };
      return;
    }

    // Renombrar la carpeta
    fs.renameSync(oldPath, newPath);

    ctx.status = 200;
    ctx.body = {
      success: true,
      message: 'Carpeta renombrada correctamente',
      data: {
        oldPath: folderPath,
        newPath: relativePath,  // ← Ruta relativa
        destination
      },
      error: null
    };

  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'Error al renombrar la carpeta',
      data: null,
      error: error.message
    };
  }
};

/**
 * DELETE /api/v1/folder
 * Eliminar una carpeta existente (debe estar vacía)
 */
export const deleteFolder = async (ctx) => {
  try {
    const { name, destination } = ctx.request.body;

    // Validaciones
    if (!name) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El nombre de la carpeta es obligatorio',
        data: null,
        error: 'FOLDER_NAME_REQUIRED'
      };
      return;
    }

    if (!destination || (destination !== 'public' && destination !== 'storage')) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El destino debe ser "public" o "storage"',
        data: null,
        error: 'INVALID_DESTINATION'
      };
      return;
    }

    // Evitar path traversal
    if (!isValidFolderName(name)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El nombre de la carpeta contiene caracteres inválidos',
        data: null,
        error: 'INVALID_FOLDER_NAME'
      };
      return;
    }

    const basePath = getBasePath(destination);
    const folderPath = path.join(basePath, name);
    const relativePath = getRelativePath(folderPath, destination);

    // Verificar si la carpeta existe
    if (!fs.existsSync(folderPath)) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: 'La carpeta no existe',
        data: null,
        error: 'FOLDER_NOT_FOUND'
      };
      return;
    }

    // Verificar si la carpeta está vacía
    const files = fs.readdirSync(folderPath);
    if (files.length > 0) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'No se puede eliminar la carpeta porque no está vacía',
        data: null,
        error: 'FOLDER_NOT_EMPTY'
      };
      return;
    }

    // Eliminar la carpeta
    fs.rmdirSync(folderPath);

    ctx.status = 200;
    ctx.body = {
      success: true,
      message: 'Carpeta eliminada correctamente',
      data: {
        name: relativePath,  // ← Ruta relativa
        destination
      },
      error: null
    };

  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'Error al eliminar la carpeta',
      data: null,
      error: error.message
    };
  }
};

/**
 * DELETE /api/v1/sub-folder
 * Eliminar una subcarpeta anidada (debe estar vacía)
 * Permite eliminar carpetas en cualquier nivel de profundidad
 */
export const deleteSubFolder = async (ctx) => {
  try {
    let { path: folderPath, destination } = ctx.request.body;

    // Validaciones
    if (!folderPath) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'La ruta de la carpeta es obligatoria',
        data: null,
        error: 'FOLDER_PATH_REQUIRED'
      };
      return;
    }

    if (!destination || (destination !== 'public' && destination !== 'storage')) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El destino debe ser "public" o "storage"',
        data: null,
        error: 'INVALID_DESTINATION'
      };
      return;
    }

    // Limpiar la ruta
    folderPath = folderPath.replace(/^\/+|\/+$/g, '');
    
    // Validar cada segmento de la ruta
    const segments = folderPath.split('/');
    for (const segment of segments) {
      if (!isValidFolderName(segment)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: `El segmento "${segment}" contiene caracteres inválidos`,
          data: null,
          error: 'INVALID_FOLDER_NAME'
        };
        return;
      }
    }

    const basePath = getBasePath(destination);
    const fullPath = buildNestedPath(basePath, folderPath);
    const relativePath = getRelativePath(fullPath, destination);

    // Verificar si la carpeta existe
    if (!fs.existsSync(fullPath)) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: 'La carpeta no existe',
        data: null,
        error: 'FOLDER_NOT_FOUND'
      };
      return;
    }

    // Verificar si la carpeta está vacía
    const files = fs.readdirSync(fullPath);
    if (files.length > 0) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'No se puede eliminar la carpeta porque no está vacía',
        data: null,
        error: 'FOLDER_NOT_EMPTY'
      };
      return;
    }

    // Eliminar la carpeta
    fs.rmdirSync(fullPath);

    ctx.status = 200;
    ctx.body = {
      success: true,
      message: 'Carpeta eliminada correctamente',
      data: {
        path: relativePath,  // ← Ruta relativa
        destination
      },
      error: null
    };

  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'Error al eliminar la carpeta',
      data: null,
      error: error.message
    };
  }
};

/**
 * GET /api/v1/folder/list
 * Listar el contenido de una carpeta (opcional)
 */
export const listFolder = async (ctx) => {
  try {
    let { path: folderPath = '', destination } = ctx.query;

    if (!destination || (destination !== 'public' && destination !== 'storage')) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El destino debe ser "public" o "storage"',
        data: null,
        error: 'INVALID_DESTINATION'
      };
      return;
    }

    // Limpiar la ruta
    folderPath = folderPath.replace(/^\/+|\/+$/g, '');
    
    // Validar segmentos si hay ruta
    if (folderPath) {
      const segments = folderPath.split('/');
      for (const segment of segments) {
        if (!isValidFolderName(segment)) {
          ctx.status = 400;
          ctx.body = {
            success: false,
            message: `El segmento "${segment}" contiene caracteres inválidos`,
            data: null,
            error: 'INVALID_FOLDER_NAME'
          };
          return;
        }
      }
    }

    const basePath = getBasePath(destination);
    const fullPath = buildNestedPath(basePath, folderPath);

    // Verificar si la carpeta existe
    if (!fs.existsSync(fullPath)) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: 'La carpeta no existe',
        data: null,
        error: 'FOLDER_NOT_FOUND'
      };
      return;
    }

    // Leer contenido de la carpeta
    const items = fs.readdirSync(fullPath);
    
    // Obtener información detallada de cada item
    const details = items.map(item => {
      const itemPath = path.join(fullPath, item);
      const stat = fs.statSync(itemPath);
      return {
        name: item,
        type: stat.isDirectory() ? 'directory' : 'file',
        size: stat.size,
        modified: stat.mtime,
        path: folderPath ? `${folderPath}/${item}` : item  // ← Ruta relativa
      };
    });

    ctx.status = 200;
    ctx.body = {
      success: true,
      message: 'Contenido de la carpeta obtenido correctamente',
      data: {
        path: folderPath || '/',  // ← Ruta relativa
        destination,
        items: details,
        count: details.length
      },
      error: null
    };

  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'Error al listar la carpeta',
      data: null,
      error: error.message
    };
  }
};