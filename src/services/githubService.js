const { graphql } = require('@octokit/graphql');
const { Octokit } = require('@octokit/rest');
const config = require('../config');
const { mapUser, mapUsers } = require('../utils/mappers');

// Inicializar clientes de GitHub
const octokit = new Octokit({
  auth: config.githubToken,
});

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `bearer ${config.githubToken}`,
  },
});

/**
 * Obtiene información del proyecto GitHub
 */
async function getProjectInfo() {
  try {
    const result = await graphqlWithAuth(`
      query {
        user(login: "${config.githubOwner}") {
          projectV2(number: ${config.githubProjectNumber}) {
            id
            fields(first: 20) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `);
    
    return {
      projectId: result.user.projectV2.id,
      fields: result.user.projectV2.fields.nodes
    };
  } catch (error) {
    console.error('Error obteniendo información del proyecto GitHub:', error);
    throw error;
  }
}

/**
 * Encuentra campo de estado y opción ID
 */
function findStatusFieldAndOption(fields, statusName) {
  const statusField = fields.find(field => field.name === 'Status');
  if (!statusField) {
    console.log('⚠️ Campo de estado no encontrado. Campos disponibles:', fields.map(f => f.name));
    return { fieldId: null, optionId: null };
  }
  
  const statusOption = statusField.options.find(option => option.name === statusName);
  
  if (!statusOption) {
    console.log(`⚠️ Opción de estado "${statusName}" no encontrada. Opciones disponibles: ${statusField.options.map(o => o.name).join(', ')}`);
  }
  
  return {
    fieldId: statusField.id,
    optionId: statusOption ? statusOption.id : null
  };
}

/**
 * Busca un issue por título
 */
async function findIssueByTitle(title) {
  try {
    const issues = await octokit.issues.listForRepo({
      owner: config.githubOwner,
      repo: config.githubRepo,
      state: 'all'
    });

    return issues.data.find(issue => issue.title === title);
  } catch (error) {
    console.error('Error buscando issue por título:', error);
    return null;
  }
}

/**
 * Crea un issue en GitHub
 */
async function createGitHubIssue(task) {
  try {
    // Verificar si ya existe un issue con el mismo título
    const existingIssue = await findIssueByTitle(task.title);
    if (existingIssue) {
      console.log(`ℹ️ Ya existe un issue con el título: ${task.title}`);
      return existingIssue;
    }

    const labels = [];
    if (task.priority) {
      try {
        await octokit.issues.getLabel({
          owner: config.githubOwner,
          repo: config.githubRepo,
          name: task.priority.toLowerCase()
        });
      } catch (error) {
        if (error.status === 404) {
          const colors = {
            high: 'e11d21',
            medium: 'fbca04',
            low: '009800'
          };
          
          await octokit.issues.createLabel({
            owner: config.githubOwner,
            repo: config.githubRepo,
            name: task.priority.toLowerCase(),
            color: colors[task.priority.toLowerCase()] || '666666'
          });
        }
      }
      
      labels.push(task.priority.toLowerCase());
    }

    const githubUsernames = task.assignees ? mapUsers(task.assignees) : [];
    let assignees = [];
    
    for (const username of githubUsernames) {
      try {
        await octokit.repos.checkCollaborator({
          owner: config.githubOwner,
          repo: config.githubRepo,
          username: username
        });
        assignees.push(username);
      } catch (error) {
        console.log(`⚠️ El usuario ${username} no tiene acceso al repositorio. No se puede asignar el issue.`);
        console.log('Sugerencia: Asegúrate de que el usuario sea colaborador del repositorio en GitHub.');
      }
    }

    console.log(`Creando issue: ${task.title}`);
    const issue = await octokit.issues.create({
      owner: config.githubOwner,
      repo: config.githubRepo,
      title: task.title,
      body: task.description || 'No hay descripción',
      assignees: assignees,
      labels: labels
    });
    
    return issue.data;
  } catch (error) {
    if (error.status === 422) {
      console.error('Error de validación al crear el issue. Verifica que:');
      console.error('1. Los usuarios asignados tienen acceso al repositorio');
      console.error('2. Las etiquetas existen en el repositorio');
      console.error('3. Tienes permisos suficientes en el repositorio');
    } else {
      console.error('Error creando issue en GitHub:', error);
    }
    throw error;
  }
}

/**
 * Añade un issue al proyecto de GitHub
 */
async function addIssueToProject(issueId, projectInfo, task) {
  try {
    const addResult = await graphqlWithAuth(`
      mutation {
        addProjectV2ItemById(input: {
          projectId: "${projectInfo.projectId}"
          contentId: "${issueId}"
        }) {
          item {
            id
          }
        }
      }
    `);
    
    const itemId = addResult.addProjectV2ItemById.item.id;
    const statusToUse = task.githubStatus || 'Backlog';
    
    const { fieldId, optionId } = findStatusFieldAndOption(
      projectInfo.fields,
      statusToUse
    );
    
    if (fieldId && optionId) {
      await graphqlWithAuth(`
        mutation {
          updateProjectV2ItemFieldValue(input: {
            projectId: "${projectInfo.projectId}"
            itemId: "${itemId}"
            fieldId: "${fieldId}"
            value: { 
              singleSelectOptionId: "${optionId}"
            }
          }) {
            projectV2Item {
              id
            }
          }
        }
      `);
    }
    
    return itemId;
  } catch (error) {
    console.error('Error añadiendo issue al proyecto:', error);
    throw error;
  }
}

/**
 * Actualiza el estado de un issue en el proyecto
 */
async function updateIssueInProject(itemId, projectInfo, status) {
  try {
    let githubStatus;
    
    if (typeof status === 'object' && status.githubStatus) {
      githubStatus = status.githubStatus;
    } else if (status === 'Cancelado') {
      githubStatus = 'Cancelado';
    } else {
      const { mapStatusExact } = require('../utils/mappers');
      githubStatus = mapStatusExact(status);
    }
    
    const { fieldId, optionId } = findStatusFieldAndOption(
      projectInfo.fields,
      githubStatus
    );
    
    if (fieldId && optionId) {
      await graphqlWithAuth(`
        mutation {
          updateProjectV2ItemFieldValue(input: {
            projectId: "${projectInfo.projectId}"
            itemId: "${itemId}"
            fieldId: "${fieldId}"
            value: { 
              singleSelectOptionId: "${optionId}"
            }
          }) {
            projectV2Item {
              id
            }
          }
        }
      `);
      console.log(`Estado del issue actualizado a "${githubStatus}"`);
    }
  } catch (error) {
    console.error('Error actualizando issue en proyecto:', error);
    throw error;
  }
}

/**
 * Actualiza título y descripción de un issue
 */
async function updateGitHubIssue(task, issueNumber) {
  try {
    let body = task.description || '';
    
    if (task.sprintPlanning) {
      body += `**Sprint**: ${task.sprintPlanning}\n`;
    }
    if (task.dueDate) {
      body += `**Fecha límite**: ${task.dueDate}\n`;
    }
    
    const labels = [];
    if (task.priority) {
      try {
        await octokit.issues.getLabel({
          owner: config.githubOwner,
          repo: config.githubRepo,
          name: task.priority.toLowerCase()
        });
      } catch (error) {
        if (error.status === 404) {
          const colors = {
            high: 'e11d21',
            medium: 'fbca04',
            low: '009800'
          };
          
          await octokit.issues.createLabel({
            owner: config.githubOwner,
            repo: config.githubRepo,
            name: task.priority.toLowerCase(),
            color: colors[task.priority.toLowerCase()] || '666666'
          });
        }
      }
      
      labels.push(task.priority.toLowerCase());
    }

    const githubUsernames = task.assignees ? mapUsers(task.assignees) : [];
    let assignees = [];
    
    for (const username of githubUsernames) {
      try {
        await octokit.repos.checkCollaborator({
          owner: config.githubOwner,
          repo: config.githubRepo,
          username: username
        });
        assignees.push(username);
      } catch (error) {
        console.log(`⚠️ El usuario ${username} no tiene acceso al repositorio. No se puede asignar el issue.`);
        console.log('Sugerencia: Asegúrate de que el usuario sea colaborador del repositorio en GitHub.');
      }
    }

    await octokit.issues.update({
      owner: config.githubOwner,
      repo: config.githubRepo,
      issue_number: issueNumber,
      title: task.title,
      body: body,
      assignees: assignees,
      labels: labels
    });
    
    console.log(`Actualizado issue #${issueNumber}`);
  } catch (error) {
    if (error.status === 422) {
      console.error('Error de validación al actualizar el issue. Verifica que:');
      console.error('1. Los usuarios asignados tienen acceso al repositorio');
      console.error('2. Las etiquetas existen en el repositorio');
      console.error('3. Tienes permisos suficientes en el repositorio');
    } else {
      console.error(`Error actualizando issue #${issueNumber}:`, error);
    }
    throw error;
  }
}

/**
 * Cierra un issue en GitHub
 */
async function closeGitHubIssue(issueNumber) {
  try {
    await octokit.issues.update({
      owner: config.githubOwner,
      repo: config.githubRepo,
      issue_number: issueNumber,
      state: 'closed'
    });
    console.log(`Cerrado issue #${issueNumber}`);
  } catch (error) {
    console.error(`Error cerrando issue #${issueNumber}:`, error);
    throw error;
  }
}

/**
 * Procesa tareas eliminadas
 */
async function processDeletedTask(task, projectInfo) {
  try {
    await updateIssueInProject(
      task.githubProjectItemId,
      projectInfo,
      'Cancelado'
    );
    
    await closeGitHubIssue(task.githubIssueNumber);
    
    return true;
  } catch (error) {
    console.error(`Error procesando tarea eliminada #${task.githubIssueNumber}:`, error);
    return false;
  }
}

/**
 * Obtiene los issues actualizados de GitHub
 */
async function getGitHubIssues() {
  try {
    const issues = await octokit.issues.listForRepo({
      owner: config.githubOwner,
      repo: config.githubRepo,
      state: 'all',
      sort: 'updated',
      direction: 'desc'
    });

    // Obtener información adicional del proyecto para cada issue
    const projectIssues = [];
    for (const issue of issues.data) {
      try {
        // Usar GraphQL para obtener el estado del proyecto
        const result = await graphqlWithAuth(`
          query {
            repository(owner: "${config.githubOwner}", name: "${config.githubRepo}") {
              issue(number: ${issue.number}) {
                projectItems(first: 1) {
                  nodes {
                    id
                    fieldValues(first: 8) {
                      nodes {
                        ... on ProjectV2ItemFieldSingleSelectValue {
                          name
                          field {
                            ... on ProjectV2SingleSelectField {
                              name
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `);

        const projectItem = result.repository.issue.projectItems.nodes[0];
        const statusField = projectItem?.fieldValues.nodes.find(
          node => node?.field?.name === 'Status'
        );

        projectIssues.push({
          id: issue.node_id,
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          assignees: issue.assignees.map(assignee => assignee.login),
          labels: issue.labels.map(label => label.name),
          lastUpdated: issue.updated_at,
          projectItemId: projectItem?.id,
          status: statusField?.name || 'Backlog'
        });
      } catch (error) {
        console.error(`Error obteniendo información del proyecto para issue #${issue.number}:`, error);
      }
    }

    return projectIssues;
  } catch (error) {
    console.error('Error obteniendo issues de GitHub:', error);
    throw error;
  }
}

module.exports = {
  getProjectInfo,
  findStatusFieldAndOption,
  createGitHubIssue,
  addIssueToProject,
  updateIssueInProject,
  updateGitHubIssue,
  closeGitHubIssue,
  processDeletedTask,
  getGitHubIssues,
  findIssueByTitle
};