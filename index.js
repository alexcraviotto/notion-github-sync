const cron = require('node-cron');
const config = require('./src/config');
const syncService = require('./src/services/syncService');

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa no manejada:', promise, 'razón:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

console.log('Iniciando servicio de sincronización Notion-GitHub...');
syncService.syncNotionWithGitHub();

console.log(`Programando sincronización con patrón cron: ${config.syncCronSchedule}`);

cron.schedule(config.syncCronSchedule, () => {
  console.log(`Ejecutando sincronización programada en ${new Date().toISOString()}`);
  syncService.syncNotionWithGitHub();
});

console.log('Servicio de sincronización Notion-GitHub iniciado');