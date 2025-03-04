/**
 * Mapeo de estados entre Notion y GitHub Projects
 * Formato: 'Estado en Notion': 'Estado en GitHub Projects'
 */
const statusMappings = {
  'Backlog': 'Backlog',
  'En progreso': 'En progreso',
  'En proceso': 'En progreso',
  'En revision': 'En revision',
  'Completado': 'Completado',
  'Terminado': 'Completado',
  'Preparado': 'Disponible',
  'Disponible': 'Disponible',
  'Cancelado': 'Cancelado',
  'Backlog': 'Backlog',
  'In progress': 'In progress',
  'In review': 'In review',
  'Done': 'Done',
  'Ready': 'Ready',
  'Canceled': 'Canceled',
};

// Estado por defecto si no se encuentra un mapeo
const defaultStatus = 'Backlog';

module.exports = {
  statusMappings,
  defaultStatus
};