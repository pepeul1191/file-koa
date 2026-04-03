export function randomFileName(length = 30) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const sanitizeFileName = (filename) => {
  if (!filename) return '';
  // Reemplazar caracteres no deseados
  return filename
    .replace(/[^a-zA-Z0-9.\u00f1\u00d1\-_]/g, '_') // Reemplaza caracteres especiales
    .replace(/\s+/g, '_') // Reemplaza espacios
    .replace(/_{2,}/g, '_'); // Evita múltiples guiones bajos seguidos
};
