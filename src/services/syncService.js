const notionService = require('./notionService');
const githubService = require('./githubService');
const stateManager = require('../utils/stateManager');

/**
 * Sincroniza tareas entre Notion y GitHub
 * @returns {Promise<void>}
 */
async function syncNotionWithGitHub() {
  console.log('🔄 Iniciando sincronización Notion -> GitHub');
  
  try {
    const state = await stateManager.getState();
    const notionEntries = await notionService.getNotionEntries();
    const projectInfo = await githubService.getProjectInfo();
    
    const currentNotionIds = new Set(notionEntries.map(entry => entry.id));
    
    // Procesar nuevas entradas y actualizaciones
    for (const entry of notionEntries) {
      if (entry.archived) continue;
      
      const existingTask = state.syncedTasks.find(task => task.notionId === entry.id);
      
      if (!existingTask) {
        const issue = await githubService.createGitHubIssue(entry);
        const projectItemId = await githubService.addIssueToProject(issue.node_id, projectInfo, entry);
        
        state.syncedTasks.push({
          notionId: entry.id,
          githubIssueId: issue.id,
          githubIssueNumber: issue.number,
          githubProjectItemId: projectItemId,
          lastNotionEdit: entry.lastEdited
        });
      } else if (new Date(entry.lastEdited) > new Date(existingTask.lastNotionEdit)) {
        console.log(`📝 Actualizando issue #${existingTask.githubIssueNumber}`);
        await githubService.updateGitHubIssue(entry, existingTask.githubIssueNumber);
        await githubService.updateIssueInProject(existingTask.githubProjectItemId, projectInfo, entry);
        existingTask.lastNotionEdit = entry.lastEdited;
      }
    }
    
    // Procesar entradas eliminadas en Notion
    const deletedTasks = state.syncedTasks.filter(task => !currentNotionIds.has(task.notionId));
    if (deletedTasks.length > 0) {
      console.log(`🗑️ Procesando ${deletedTasks.length} tareas eliminadas en Notion`);
      
      for (const task of deletedTasks) {
        const success = await githubService.processDeletedTask(task, projectInfo);
        if (success) {
          state.syncedTasks = state.syncedTasks.filter(t => t.notionId !== task.notionId);
        }
      }
    }
    
    await stateManager.saveState(state);
    console.log('✅ Sincronización completada');
    
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
    throw error;
  }
}

module.exports = {
  syncNotionWithGitHub
};