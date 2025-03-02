const { statusMappings, defaultStatus } = require('../config/statusMappings');
const userMappings = require('../config/userMappings');

/**
 * Mapeo exacto de estados de Notion a GitHub Projects
 * @param {string} notionStatus - Estado en Notion
 * @returns {string} Estado correspondiente en GitHub Projects
 */
function mapStatusExact(notionStatus) {
  // Si encontramos un mapeo exacto, lo usamos
  if (statusMappings[notionStatus]) {
    console.log(`Mapeo exacto encontrado para "${notionStatus}": "${statusMappings[notionStatus]}"`);
    return statusMappings[notionStatus];
  }

  // Si no hay mapeo exacto, usamos el estado por defecto
  console.log(`No se encontró mapeo exacto para "${notionStatus}", usando ${defaultStatus}`);
  return defaultStatus;
}

/**
 * Mapea usuarios de Notion a nombres de usuario de GitHub
 * @param {string} notionUser - Nombre de usuario en Notion
 * @returns {string|null} Nombre de usuario en GitHub o null si no hay mapeo
 */
function mapUser(notionUser) {
  if (!notionUser) return null;
  notionUser = notionUser.trim();
  const githubUser = userMappings[notionUser];
  console.log(`Mapeando usuario de Notion "${notionUser}" a "${githubUser}"`);
  if (!githubUser) {
    console.log(`⚠️ No se encontró mapeo para el usuario de Notion: ${notionUser}`);
  }
  
  return githubUser || null;
}

module.exports = {
  mapStatusExact,
  mapUser
};