// configs/database.js
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

// Equivalente a __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname, '../db/app.db'),
  logging: false,
});

export default sequelize;