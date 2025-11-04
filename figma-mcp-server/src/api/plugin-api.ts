import express from 'express';
import { PluginHealthcheckRequest } from '../types.js';
import { pluginConnections, getAndClearMessages, addToMessageQueue } from './message-queue.js';

// Create router for plugin API
export const pluginRouter = express.Router();

// Endpoint to check plugin connection status
pluginRouter.post('/healthcheck', (req, res) => {
  const { pluginId, fileId } = req.body as PluginHealthcheckRequest;
  if (!pluginId || !fileId) {
    return res.status(400).json({ error: 'pluginId and fileId are required' });
  }
  
  pluginConnections[fileId] = {
    pluginId,
    lastSeen: new Date(),
    status: 'connected'
  };
  
  res.json({ success: true });
});

// Polling endpoint from plugin
pluginRouter.get('/poll/:fileId/:pluginId', (req, res) => {
  const { fileId, pluginId } = req.params;
  
  // Update connection info
  if (pluginConnections[fileId]) {
    pluginConnections[fileId].lastSeen = new Date();
    pluginConnections[fileId].status = 'connected';
  } else {
    pluginConnections[fileId] = {
      pluginId,
      lastSeen: new Date(),
      status: 'connected'
    };
  }
  
  // Get and return messages from queue
  const messages = getAndClearMessages(fileId);
  
  return res.json({ messages });
});