/**
 * Mapeo de estados entre Notion y GitHub Projects
 * 
 * INSTRUCCIONES:
 * 1. Copia este archivo a src/config/statusMappings.js
 * 2. Modifica los estados según tu configuración de Notion y GitHub Projects
 * 3. Asegúrate de que los estados de GitHub coincidan con los que tienes en tu Project
 */
const statusMappings = {
  // Estados de ejemplo - modifícalos según tu configuración
  'Por hacer': 'Backlog',
  'En progreso': 'In Progress',
  'Revisión': 'Review',
  'Completado': 'Done',
  'Cancelado': 'Cancelled'
};

// Estado por defecto si no se encuentra un mapeo
const defaultStatus = 'Backlog';

module.exports = {
  statusMappings,
  defaultStatus
};