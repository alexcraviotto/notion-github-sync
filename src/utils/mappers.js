/**
 * Mapeo exacto de estados de Notion a GitHub Projects
 * @param {string} notionStatus - Estado en Notion
 * @returns {string} Estado correspondiente en GitHub Projects
 */
function mapStatusExact(notionStatus) {
  // Tabla de mapeo exacto según los valores mostrados en la consola
  const exactStatusMap = {
    'Sin Empezar': 'Backlog',
    'En progreso': 'En progreso', 
    'En proceso': 'En progreso',
    'En revision': 'En revision',
    'Completado': 'Completado',
    'Terminado': 'Completado',
    'Preparado': 'Disponible',
    'Disponible': 'Disponible',
    'Cancelado': 'Cancelado',
   
  };

  // Si encontramos un mapeo exacto, lo usamos
  if (exactStatusMap[notionStatus]) {
    console.log(`Mapeo exacto encontrado para "${notionStatus}": "${exactStatusMap[notionStatus]}"`);
    return exactStatusMap[notionStatus];
  }

  // Si no hay mapeo exacto, usamos Backlog como valor predeterminado
  console.log(`No se encontró mapeo exacto para "${notionStatus}", usando Backlog`);
  return 'Backlog';
}

/**
 * Mapea usuarios de Notion a nombres de usuario de GitHub
 * @param {string} notionUser - Nombre de usuario en Notion
 * @returns {string|null} Nombre de usuario en GitHub o null si no hay mapeo
 */
function mapUser(notionUser) {
  const userMap = {
    'Alex Craviotto': 'alexcraviotto',
    // Puedes agregar más mapeos aquí siguiendo el mismo formato:
    // 'Nombre en Notion': 'usuario-github'
  };
  
  if (!notionUser) return null;
  
  const githubUser = userMap[notionUser];
  if (!githubUser) {
    console.log(`⚠️ No se encontró mapeo para el usuario de Notion: ${notionUser}`);
  }
  
  return githubUser || null; // Retorna null si no se encuentra un mapeo
}

module.exports = {
  mapStatusExact,
  mapUser
};