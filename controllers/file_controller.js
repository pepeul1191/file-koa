import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import { randomFileName } from '../configs/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper para validar nombres de carpetas (evitar path traversal)
 */
const isValidFolderName = (name) => {
  if (!name) return false;
  // Evitar secuencias peligrosas
  if (name.includes('..')) return false;
  if (name.includes('/') || name.includes('\\')) return false;
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
 * Helper para validar ruta completa
 */
const validateFolderPath = (folderPath) => {
  if (!folderPath) return false;
  
  // Limpiar la ruta
  const cleanPath = folderPath.replace(/^\/+|\/+$/g, '');
  
  // Validar cada segmento
  const segments = cleanPath.split('/');
  for (const segment of segments) {
    if (!isValidFolderName(segment)) {
      return false;
    }
  }
  
  return true;
};

/**
 * POST /api/v1/public
 * Subir archivo a public con soporte para subcarpetas
 */
export const uploadPublic = async (ctx) => {
  try {
    let { folder } = ctx.request.body;
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

    // Validar ruta de carpeta
    if (!validateFolderPath(folder)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'La ruta de la carpeta contiene caracteres inválidos',
        data: null,
        error: 'INVALID_FOLDER_PATH'
      };
      return;
    }

    // Limpiar la ruta
    folder = folder.replace(/^\/+|\/+$/g, '');

    // ruta base /public
    const publicPath = path.join(__dirname, '../public');
    const folderPath = buildNestedPath(publicPath, folder);

    // crear folder y subcarpetas si no existen
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

    // Construir ruta relativa para la respuesta
    const relativePath = folder ? `${folder}/${newFileName}` : newFileName;

    ctx.status = 200;
    ctx.body = {
      success: true,
      message: 'Archivo subido correctamente',
      data: {
        folder: folder || '/',
        filename: newFileName,
        path: relativePath,
        fullPath: finalPath
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
};

/**
 * POST /api/v1/storage
 * Subir archivo a storage con soporte para subcarpetas
 */
export const uploadStorage = async (ctx) => {
  try {
    let { folder } = ctx.request.body;
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

    // Validar ruta de carpeta
    if (!validateFolderPath(folder)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'La ruta de la carpeta contiene caracteres inválidos',
        data: null,
        error: 'INVALID_FOLDER_PATH'
      };
      return;
    }

    // Limpiar la ruta
    folder = folder.replace(/^\/+|\/+$/g, '');

    // ruta base /storage
    const storagePath = path.join(__dirname, '../storage');
    const folderPath = buildNestedPath(storagePath, folder);

    // crear folder y subcarpetas si no existen
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

    // Construir ruta relativa para la respuesta
    const relativePath = folder ? `${folder}/${newFileName}` : newFileName;

    ctx.status = 200;
    ctx.body = {
      success: true,
      message: 'Archivo subido correctamente',
      data: {
        folder: folder || '/',
        filename: newFileName,
        path: relativePath,
        fullPath: finalPath
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
};

/**
 * GET /api/v1/storage
 * Descargar archivo desde storage con soporte para subcarpetas
 */
export const downloadStorage = async (ctx) => {
  try {
    let { folder, file, filename } = ctx.query;

    if (!folder || !file) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'folder y file son obligatorios',
        data: null,
        error: 'PARAMS_REQUIRED'
      };
      return;
    }

    // Validar ruta de carpeta
    if (!validateFolderPath(folder)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'La ruta de la carpeta contiene caracteres inválidos',
        data: null,
        error: 'INVALID_FOLDER_PATH'
      };
      return;
    }

    // Validar nombre de archivo
    if (!isValidFolderName(file)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El nombre del archivo contiene caracteres inválidos',
        data: null,
        error: 'INVALID_FILE_NAME'
      };
      return;
    }

    if (filename && !isValidFolderName(filename)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El nombre de descarga contiene caracteres inválidos',
        data: null,
        error: 'INVALID_FILENAME'
      };
      return;
    }

    // Limpiar la ruta
    folder = folder.replace(/^\/+|\/+$/g, '');

    const storagePath = path.join(__dirname, '../storage');
    const folderPath = buildNestedPath(storagePath, folder);
    const filePath = path.join(folderPath, file);

    // validar existencia
    if (!fs.existsSync(filePath)) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: 'Archivo no encontrado',
        data: null,
        error: 'FILE_NOT_FOUND'
      };
      return;
    }

    // Obtener la extensión del archivo original
    const originalExt = path.extname(file);
    
    // Construir el nombre de descarga
    let downloadFileName;
    if (filename) {
      // Si filename tiene ya extensión, usarlo tal cual
      // Si no tiene extensión, agregar la del archivo original
      const filenameExt = path.extname(filename);
      downloadFileName = filenameExt ? filename : `${filename}${originalExt}`;
    } else {
      downloadFileName = file;
    }
    
    // headers de descarga
    ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadFileName)}"`);
    ctx.set('Content-Type', 'application/octet-stream');

    ctx.body = fs.createReadStream(filePath);

  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'Error al descargar el archivo',
      data: null,
      error: error.message
    };
  }
};

/**
 * DELETE /api/v1/storage
 * Eliminar un archivo de storage (opcional - si lo necesitas)
 */
export const deleteStorage = async (ctx) => {
  try {
    let { folder, file } = ctx.request.body;

    if (!folder || !file) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'folder y file son obligatorios',
        data: null,
        error: 'PARAMS_REQUIRED'
      };
      return;
    }

    // Validar ruta de carpeta
    if (!validateFolderPath(folder)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'La ruta de la carpeta contiene caracteres inválidos',
        data: null,
        error: 'INVALID_FOLDER_PATH'
      };
      return;
    }

    // Validar nombre de archivo
    if (!isValidFolderName(file)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'El nombre del archivo contiene caracteres inválidos',
        data: null,
        error: 'INVALID_FILE_NAME'
      };
      return;
    }

    // Limpiar la ruta
    folder = folder.replace(/^\/+|\/+$/g, '');

    const storagePath = path.join(__dirname, '../storage');
    const folderPath = buildNestedPath(storagePath, folder);
    const filePath = path.join(folderPath, file);

    // validar existencia
    if (!fs.existsSync(filePath)) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: 'Archivo no encontrado',
        data: null,
        error: 'FILE_NOT_FOUND'
      };
      return;
    }

    // Eliminar el archivo
    await fs.promises.unlink(filePath);

    ctx.status = 200;
    ctx.body = {
      success: true,
      message: 'Archivo eliminado correctamente',
      data: {
        folder,
        file,
        path: folder ? `${folder}/${file}` : file
      },
      error: null
    };

  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: 'Error al eliminar el archivo',
      data: null,
      error: error.message
    };
  }
};