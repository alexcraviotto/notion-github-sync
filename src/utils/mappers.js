const { statusMappings, defaultStatus } = require('../config/statusMappings');
const userMappings = require('../config/userMappings');

const reverseUserMappings = Object.entries(userMappings).reduce((acc, [notionUser, githubUser]) => {
  acc[githubUser] = notionUser;
  return acc;
}, {});

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

/**
 * Mapea usuario de GitHub a nombre de usuario de Notion
 * @param {string} githubUser - Nombre de usuario en GitHub
 * @returns {string|null} Nombre de usuario en Notion o null si no hay mapeo
 */
function mapGithubUser(githubUser) {
  if (!githubUser) return null;
  githubUser = githubUser.trim();
  const notionUser = reverseUserMappings[githubUser];
  
  if (!notionUser) {
    console.log(`⚠️ No se encontró mapeo inverso para el usuario de GitHub: ${githubUser}`);
  }
  
  return notionUser || null;
}

/**
 * Mapea múltiples usuarios de GitHub a nombres de usuario de Notion
 * @param {string[]} githubUsers - Array de nombres de usuario en GitHub
 * @returns {string[]} Array de nombres de usuario en Notion (filtrados los no mapeados)
 */
function mapGithubUsers(githubUsers) {
  if (!githubUsers || !Array.isArray(githubUsers)) return [];
  return githubUsers
    .map(user => mapGithubUser(user))
    .filter(user => user !== null);
}

module.exports = {
  mapStatusExact,
  mapUser,
  mapUsers,
  mapGithubUser,
  mapGithubUsers
};