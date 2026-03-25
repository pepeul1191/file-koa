// controllers/file_controller.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import { randomFileName } from '../configs/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadPublic = async (ctx) => {
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
};

export const uploadStorage = async (ctx) => {
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

    // ruta base /storage
    const storagePath = path.join(__dirname, '../storage');
    const folderPath = path.join(storagePath, folder);

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
};

export const downloadStorage = async (ctx) => {
  try {
    const { folder, file, filename } = ctx.query;

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

    // 🔒 evitar path traversal
    if (folder.includes('..') || file.includes('..') || (filename && filename.includes('..'))) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: 'Ruta inválida',
        error: 'INVALID_PATH'
      };
      return;
    }

    const storagePath = path.join(__dirname, '../storage');
    const filePath = path.join(storagePath, folder, file);

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