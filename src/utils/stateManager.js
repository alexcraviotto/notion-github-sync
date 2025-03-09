const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

const STATE_FILE = path.resolve(config.stateFilePath);

/**
 * Obtiene el estado actual de la sincronización
 * @returns {Promise<Object>} El estado actual
 */
async function getState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      lastSync: null,
      syncedTasks: []
    };
  }
}

/**
 * Guarda el estado de la sincronización
 * @param {Object} state - El estado a guardar
 * @returns {Promise<void>}
 */
async function saveState(state) {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

module.exports = {
  getState,
  saveState
};