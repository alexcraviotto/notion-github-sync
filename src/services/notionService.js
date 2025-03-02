const { Client } = require('@notionhq/client');
const config = require('../config');
const { mapStatusExact, mapGithubUsers } = require('../utils/mappers');

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
      const status = page.properties.Estado?.status.name || 'Backlog';
      const assignees = page.properties['Asignado a']?.people?.map(person => person.name) || [];
      const priority = page.properties.Prioridad?.select?.name || null;
      
      let dueDate = null;
      if (page.properties['Fecha Limite']?.date) {
        dueDate = page.properties['Fecha Limite'].date.start;
      }
      
      const githubStatus = mapStatusExact(status);
      
      return {
        id: page.id,
        title,
        status,
        description,
        githubStatus,
        assignees,
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

/**
 * Verifica si existe una página con el mismo título
 */
async function findPageByTitle(title) {
  try {
    const response = await notion.databases.query({
      database_id: config.notionDatabaseId,
      filter: {
        property: 'Nombre',
        title: {
          equals: title
        }
      }
    });
    
    return response.results[0] || null;
  } catch (error) {
    console.error('Error buscando página por título:', error);
    return null;
  }
}

/**
 * Actualiza una página en Notion
 */
async function updateNotionPage(pageId, data) {
  try {
    const properties = {};
    
    if (data.title) {
      properties['Nombre'] = {
        title: [{ text: { content: data.title } }]
      };
    }
    
    if (data.description) {
      properties['Descripcion'] = {
        rich_text: [{ text: { content: data.description } }]
      };
    }
    
    if (data.status) {
      properties['Estado'] = {
        status: {
          name: data.status
        }
      };
    }
    
    if (data.priority) {
      properties['Prioridad'] = {
        select: {
          name: data.priority
        }
      };
    }
    
    if (data.assignees && data.assignees.length > 0) {
      // Mapear usuarios de GitHub a Notion
      const notionUsers = mapGithubUsers(data.assignees);
      const users = [];
      
      // Obtener los IDs de usuario de Notion
      const response = await notion.users.list();
      for (const notionUser of notionUsers) {
        const user = response.results.find(u => u.name === notionUser);
        if (user) {
          users.push({ id: user.id });
        } else {
          console.log(`⚠️ No se encontró el usuario ${notionUser} en Notion`);
        }
      }
      
      if (users.length > 0) {
        properties['Asignado a'] = {
          people: users
        };
      }
    }
    
    await notion.pages.update({
      page_id: pageId,
      properties: properties
    });
    
    console.log(`✅ Página Notion actualizada: ${data.title}`);
  } catch (error) {
    console.error('Error actualizando página en Notion:', error);
    throw error;
  }
}

/**
 * Crea una nueva página en Notion desde un issue de GitHub
 */
async function createNotionPage(issueData) {
  try {
    // Verificar si ya existe una página con el mismo título
    const existingPage = await findPageByTitle(issueData.title);
    if (existingPage) {
      console.log(`ℹ️ Ya existe una página con el título: ${issueData.title}`);
      return existingPage.id;
    }

    const properties = {
      'Nombre': {
        title: [{ text: { content: issueData.title } }]
      },
      'Descripcion': {
        rich_text: [{ text: { content: issueData.description || '' } }]
      },
      'Estado': {
        status: {
          name: issueData.status || 'Backlog'
        }
      }
    };

    if (issueData.priority) {
      properties['Prioridad'] = {
        select: {
          name: issueData.priority
        }
      };
    }

    if (issueData.assignees && issueData.assignees.length > 0) {
      // Mapear usuarios de GitHub a Notion
      const notionUsers = mapGithubUsers(issueData.assignees);
      const users = [];
      
      // Obtener los IDs de usuario de Notion
      const response = await notion.users.list();
      for (const notionUser of notionUsers) {
        const user = response.results.find(u => u.name === notionUser);
        if (user) {
          users.push({ id: user.id });
        } else {
          console.log(`⚠️ No se encontró el usuario ${notionUser} en Notion`);
        }
      }
      
      if (users.length > 0) {
        properties['Asignado a'] = {
          people: users
        };
      }
    }

    const response = await notion.pages.create({
      parent: { database_id: config.notionDatabaseId },
      properties: properties
    });

    console.log(`✅ Creada nueva página en Notion: ${issueData.title}`);
    return response.id;
  } catch (error) {
    console.error('Error creando página en Notion:', error);
    throw error;
  }
}

/**
 * Extrae el ID de Notion del cuerpo del issue de GitHub
 */
function extractNotionId(body) {
  if (!body) return null;
  const match = body.match(/Importado desde Notion: ([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
}

module.exports = {
  getNotionEntries,
  updateNotionPage,
  extractNotionId,
  createNotionPage,
  findPageByTitle
};