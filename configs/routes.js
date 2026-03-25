// configs/routes.js
import Router from 'koa-router';

// Importar controladores
import { 
  signIn, 
  translateToken } from '../controllers/auth_controller.js';
import { 
  uploadPublic, 
  uploadStorage, 
  downloadStorage 
} from '../controllers/file_controller.js';
import {
  createFolder,
  createSubFolder,
  renameFolder,
  renameSubFolder,
  deleteFolder,
  deleteSubFolder,
  listFolder  // Nuevo método para listar
} from '../controllers/folder_controller.js';

// Importar middlewares
import { requireAuth, authTrigger } from './middlewares.js';

const router = new Router();

// Auth routes
router.post('/api/v1/sign-in', authTrigger, signIn);
router.get('/api/v1/token/translate', authTrigger, translateToken);

// File routes
router.post('/api/v1/public', uploadPublic);
router.post('/api/v1/storage', uploadStorage);
router.get('/api/v1/storage', downloadStorage);

// Folder routes
router.post('/api/v1/folder', createFolder);
router.post('/api/v1/sub-folder', createSubFolder);
router.put('/api/v1/folder', renameFolder);
router.put('/api/v1/sub-folder', renameSubFolder);
router.delete('/api/v1/folder', deleteFolder);
router.delete('/api/v1/sub-folder', deleteSubFolder);
router.get('/api/v1/folder/list', listFolder);  // Nuevo endpoint para listar

export default router;