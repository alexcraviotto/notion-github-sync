const notionService = require('./notionService');
const githubService = require('./githubService');
const stateManager = require('../utils/stateManager');

/**
 * Sincroniza tareas entre Notion y GitHub
 * @returns {Promise<void>}
 */
async function syncNotionWithGitHub() {
  console.log('Iniciando sincronización de Notion a GitHub...');
  
  try {
    const state = await stateManager.getState();
    
    const notionEntries = await notionService.getNotionEntries();
    const projectInfo = await githubService.getProjectInfo();
    
    const currentNotionIds = new Set(notionEntries.map(entry => entry.id));
    
    for (const entry of notionEntries) {
      if (entry.archived) continue;
      
      const existingTask = state.syncedTasks.find(task => task.notionId === entry.id);
      
      if (!existingTask) {
        console.log(`Creando nuevo issue para: ${entry.title}`);
        const issue = await githubService.createGitHubIssue(entry);
        const projectItemId = await githubService.addIssueToProject(issue.node_id, projectInfo, entry);
        
        state.syncedTasks.push({
          notionId: entry.id,
          githubIssueId: issue.id,
          githubIssueNumber: issue.number,
          githubProjectItemId: projectItemId,
          title: entry.title,
          description: entry.description,
          status: entry.status,
          githubStatus: entry.githubStatus,
          assignee: entry.assignee,
          priority: entry.priority,
          sprintPlanning: entry.sprintPlanning,
          dueDate: entry.dueDate,
          lastEdited: entry.lastEdited
        });
      } else if (
        existingTask.title !== entry.title ||
        existingTask.description !== entry.description ||
        existingTask.status !== entry.status ||
        existingTask.assignee !== entry.assignee ||
        existingTask.priority !== entry.priority ||
        existingTask.sprintPlanning !== entry.sprintPlanning ||
        existingTask.dueDate !== entry.dueDate ||
        existingTask.lastEdited !== entry.lastEdited
      ) {
        console.log(`Actualizando issue ${existingTask.githubIssueNumber} para: ${entry.title}`);
        
        await githubService.updateGitHubIssue(entry, existingTask.githubIssueNumber);
        
        if (existingTask.status !== entry.status) {
          console.log(`- Estado cambiado de "${existingTask.status}" a "${entry.status}"`);
          await githubService.updateIssueInProject(
            existingTask.githubProjectItemId,
            projectInfo,
            entry
          );
        }
        
        Object.assign(existingTask, {
          title: entry.title,
            description: entry.description,
          status: entry.status,
          githubStatus: entry.githubStatus,
          assignee: entry.assignee,
          priority: entry.priority,
          sprintPlanning: entry.sprintPlanning,
          dueDate: entry.dueDate,
          lastEdited: entry.lastEdited
        });
      }
    }
    
    const deletedTasks = state.syncedTasks.filter(
      task => !currentNotionIds.has(task.notionId)
    );
    
    for (const deletedTask of deletedTasks) {
      await githubService.processDeletedTask(deletedTask, projectInfo);
      state.syncedTasks = state.syncedTasks.filter(task => task.notionId !== deletedTask.notionId);
    }
    
    state.lastSync = new Date().toISOString();
    await stateManager.saveState(state);
    
    console.log('Sincronización completada exitosamente!');
  } catch (error) {
    console.error('Error en la sincronización:', error);
    throw error;
  }
}

module.exports = {
  syncNotionWithGitHub
};