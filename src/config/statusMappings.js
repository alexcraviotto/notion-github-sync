/**
 * Mapeo de estados entre Notion y GitHub Projects
 * Formato: 'Estado en Notion': 'Estado en GitHub Projects'
 */
const statusMappings = {
  'Sin Empezar': 'Backlog',
  'En progreso': 'En progreso',
  'En proceso': 'En progreso',
  'En revision': 'En revision',
  'Completado': 'Completado',
  'Terminado': 'Completado',
  'Preparado': 'Disponible',
  'Disponible': 'Disponible',
  'Cancelado': 'Cancelado'
};

// Estado por defecto si no se encuentra un mapeo
const defaultStatus = 'Backlog';

module.exports = {
  statusMappings,
  defaultStatus
};