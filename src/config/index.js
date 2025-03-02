require('dotenv').config();

// Configuración para la aplicación
const config = {
  // Notion
  notionApiKey: process.env.NOTION_API_KEY,
  notionDatabaseId: process.env.NOTION_DATABASE_ID,
  
  // GitHub
  githubToken: process.env.GITHUB_TOKEN,
  githubOwner: process.env.GITHUB_OWNER,
  githubRepo: process.env.GITHUB_REPO,
  githubProjectNumber: process.env.GITHUB_PROJECT_NUMBER,
  
  // Estado de la sincronización
  stateFilePath: process.env.STATE_FILE_PATH || './sync-state.json',
  
  // CRON para sincronización periódica
  syncCronSchedule: process.env.SYNC_INTERVAL_CRON || '*/5 * * * *', // Por defecto cada 5 minutos
};

module.exports = config;