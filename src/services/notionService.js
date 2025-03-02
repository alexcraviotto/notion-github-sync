const { Client } = require('@notionhq/client');
const config = require('../config');
const { mapStatusExact } = require('../utils/mappers');

// Inicializar cliente de Notion
const notion = new Client({
  auth: config.notionApiKey,
});

/**
 * Obtiene las entradas de la base de datos de Notion
 * @returns {Promise<Array>} Array de tareas de Notion
 */
async function getNotionEntries() {
  try {
    const response = await notion.databases.query({
      database_id: config.notionDatabaseId,
    });
    
    console.log(`Recuperadas ${response.results.length} entradas desde Notion`);
    
    return response.results.map(page => {
      const title = page.properties.Nombre?.title?.[0]?.plain_text || 'Sin título';
      const description = page.properties.Descripcion?.rich_text[0]?.text.content || 'No se ha proporcionado descripción';
      console.log(`[${title}] Descripción: ${description}`);
      const status = page.properties.Estado?.status.name || 'Sin Empezar';
      console.log(page.properties);
      
      // Get all assignees instead of just the first one
      const assignees = page.properties['Asignado a']?.people?.map(person => person.name) || [];
      
      const priority = page.properties.Prioridad?.select?.name || null;
      console.log(page.properties.Prioridad);
      console.log('Asignados:', assignees, 'Prioridad:', priority);
      
      let dueDate = null;
      if (page.properties['Fecha Limite']?.date) {
        dueDate = page.properties['Fecha Limite'].date.start;
      }
      
      const githubStatus = mapStatusExact(status);
      console.log(`[${title}] Estado en Notion: "${status}" -> GitHub Project: "${githubStatus}"`);
      
      return {
        id: page.id,
        title,
        status,
        description,
        githubStatus,
        assignees, // Now returning array of assignees
        priority,
        dueDate,
        lastEdited: page.last_edited_time,
        archived: page.archived || false
      };
    });
  } catch (error) {
    console.error('Error obteniendo datos de Notion:', error);
    throw error;
  }
}

module.exports = {
  getNotionEntries
};