const notionService = require('./notionService');
const githubService = require('./githubService');
const stateManager = require('../utils/stateManager');

/**
 * Sincroniza tareas entre Notion y GitHub en ambas direcciones
 * @returns {Promise<void>}
 */
async function syncNotionWithGitHub() {
  console.log('🔄 Iniciando sincronización bidireccional');
  
  try {
    const state = await stateManager.getState();
    const [notionEntries, githubIssues, projectInfo] = await Promise.all([
      notionService.getNotionEntries(),
      githubService.getGitHubIssues(),
      githubService.getProjectInfo()
    ]);
    
    const currentNotionIds = new Set(notionEntries.map(entry => entry.id));
    const currentGithubNumbers = new Set(githubIssues.map(issue => issue.number));
    
    // Sincronizar cambios de Notion a GitHub
    for (const entry of notionEntries) {
      if (entry.archived) continue;
      
      const existingTask = state.syncedTasks.find(task => task.notionId === entry.id);
      
      if (!existingTask) {
        console.log(`📝 Creando nuevo issue para: ${entry.title}`);
        const issue = await githubService.createGitHubIssue(entry);
        const projectItemId = await githubService.addIssueToProject(issue.node_id, projectInfo, entry);
        
        state.syncedTasks.push({
          notionId: entry.id,
          githubIssueId: issue.id,
          githubIssueNumber: issue.number,
          githubProjectItemId: projectItemId,
          lastNotionEdit: entry.lastEdited,
          lastGithubEdit: issue.updated_at,
          contentHash: calculateContentHash(entry)
        });
      } else {
        const lastNotionEdit = new Date(entry.lastEdited);
        const lastGithubEdit = new Date(existingTask.lastGithubEdit || 0);
        const currentHash = calculateContentHash(entry);
        
        // Solo actualizar GitHub si hay cambios reales en el contenido
        if (lastNotionEdit > lastGithubEdit && currentHash !== existingTask.contentHash) {
          console.log(`📝 Actualizando issue #${existingTask.githubIssueNumber} desde Notion`);
          await githubService.updateGitHubIssue(entry, existingTask.githubIssueNumber);
          await githubService.updateIssueInProject(existingTask.githubProjectItemId, projectInfo, entry);
          existingTask.lastNotionEdit = entry.lastEdited;
          existingTask.contentHash = currentHash;
        }
      }
    }
    
    // Sincronizar cambios de GitHub a Notion
    for (const issue of githubIssues) {
      const existingTask = state.syncedTasks.find(task => task.githubIssueNumber === issue.number);
      const notionId = existingTask?.notionId || notionService.extractNotionId(issue.body);
      
      if (!notionId && !existingTask) {
        // Nuevo issue creado en GitHub
        console.log(`📝 Creando nueva página en Notion para issue #${issue.number}`);
        const notionId = await notionService.createNotionPage({
          title: issue.title,
          description: issue.body,
          status: issue.status,
          assignees: issue.assignees,
          priority: issue.labels.find(label => ['high', 'medium', 'low'].includes(label))
        });
        
        state.syncedTasks.push({
          notionId: notionId,
          githubIssueId: issue.id,
          githubIssueNumber: issue.number,
          githubProjectItemId: issue.projectItemId,
          lastNotionEdit: new Date().toISOString(),
          lastGithubEdit: issue.lastUpdated,
          contentHash: calculateContentHash(issue)
        });
      } else if (existingTask) {
        const lastGithubEdit = new Date(issue.lastUpdated);
        const lastNotionEdit = new Date(existingTask.lastNotionEdit || 0);
        const currentHash = calculateContentHash(issue);
        
        // Solo actualizar Notion si hay cambios reales en el contenido
        if (lastGithubEdit > lastNotionEdit && currentHash !== existingTask.contentHash) {
          console.log(`📝 Actualizando Notion desde GitHub issue #${issue.number}`);
          
          // Mapear estado de GitHub a Notion
          let notionStatus = issue.status;
          if (issue.state === 'closed') {
            notionStatus = 'Completado';
          }
          
          await notionService.updateNotionPage(existingTask.notionId, {
            title: issue.title,
            description: issue.body,
            status: notionStatus,
            assignees: issue.assignees,
            priority: issue.labels.find(label => ['high', 'medium', 'low'].includes(label))
          });
          
          existingTask.lastGithubEdit = issue.lastUpdated;
          existingTask.contentHash = currentHash;
        }
      }
    }
    
    // Limpiar tareas eliminadas
    state.syncedTasks = state.syncedTasks.filter(task => {
      const existsInNotion = currentNotionIds.has(task.notionId);
      const existsInGithub = currentGithubNumbers.has(task.githubIssueNumber);
      return existsInNotion || existsInGithub;
    });
    
    await stateManager.saveState(state);
    console.log('✅ Sincronización bidireccional completada');
    
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
    throw error;
  }
}

/**
 * Calcula un hash del contenido para detectar cambios reales
 */
function calculateContentHash(item) {
  const content = JSON.stringify({
    title: item.title,
    description: item.description || item.body,
    status: item.status,
    assignees: item.assignees,
    priority: item.priority
  });
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

module.exports = {
  syncNotionWithGitHub
};