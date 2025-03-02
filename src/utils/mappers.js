const { statusMappings, defaultStatus } = require('../config/statusMappings');
const userMappings = require('../config/userMappings');

/**
 * Mapeo exacto de estados de Notion a GitHub Projects
 * @param {string} notionStatus - Estado en Notion
 * @returns {string} Estado correspondiente en GitHub Projects
 */
function mapStatusExact(notionStatus) {
  if (statusMappings[notionStatus]) {
    return statusMappings[notionStatus];
  }
  
  console.log(`⚠️ No se encontró mapeo exacto para "${notionStatus}", usando ${defaultStatus}`);
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
  
  if (!githubUser) {
    console.log(`⚠️ No se encontró mapeo para el usuario de Notion: ${notionUser}`);
  }
  
  return githubUser || null;
}

/**
 * Mapea múltiples usuarios de Notion a nombres de usuario de GitHub
 * @param {string[]} notionUsers - Array de nombres de usuario en Notion
 * @returns {string[]} Array de nombres de usuario en GitHub (filtrados los no mapeados)
 */
function mapUsers(notionUsers) {
  if (!notionUsers || !Array.isArray(notionUsers)) return [];
  return notionUsers
    .map(user => mapUser(user))
    .filter(user => user !== null);
}

module.exports = {
  mapStatusExact,
  mapUser,
  mapUsers
};