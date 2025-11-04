import { Hono } from 'hono';
import type { Context } from 'hono';
import type { UpgradeWebSocket } from 'hono/ws';
import { PluginHealthcheckRequest } from '../types.js';
import {
  registerWebSocketConnection,
  unregisterWebSocketConnection,
  pluginConnections
} from './message-queue.js';

// Create router for plugin API
export const pluginRouter = new Hono();

// This will be set by the main server
export let upgradeWebSocketFn: UpgradeWebSocket | null = null;

export function setUpgradeWebSocket(upgradeFn: UpgradeWebSocket): void {
  upgradeWebSocketFn = upgradeFn;
}

// Endpoint to check plugin connection status
pluginRouter.post('/healthcheck', async (c: Context) => {
  const body = await c.req.json() as PluginHealthcheckRequest;
  const { pluginId, fileId } = body;
  
  if (!pluginId || !fileId) {
    return c.json({ error: 'pluginId and fileId are required' }, 400);
  }
  
  // Connection will be registered via WebSocket
  return c.json({ success: true });
});

// WebSocket endpoint for plugin communication
pluginRouter.get('/ws', (c) => {
  if (!upgradeWebSocketFn) {
    return c.text('WebSocket not initialized', 500);
  }
  return upgradeWebSocketFn(c, {
    onOpen(event: any, ws: any) {
      // Extract fileId and pluginId from query params
      const url = new URL(c.req.url);
      const fileId = url.searchParams.get('fileId');
      const pluginId = url.searchParams.get('pluginId');

      if (!fileId || !pluginId) {
        console.error('WebSocket connection missing fileId or pluginId');
        ws.close(1008, 'fileId and pluginId are required');
        return;
      }

      console.error(`WebSocket connection opened for file ${fileId}, plugin ${pluginId}`);
      
      // Register the WebSocket connection
      registerWebSocketConnection(fileId, pluginId, ws);
    },
    onMessage(event: any, ws: any) {
      try {
        // Handle incoming messages from plugin (if needed)
        const data = JSON.parse(event.data.toString());
        console.error('Received message from plugin:', data);
        
        // Extract fileId from connection (we could store it in ws metadata)
        // For now, we'll rely on the plugin sending fileId in messages if needed
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    },
    onClose(event: any, ws: any) {
      // Find and unregister the connection
      // We need to find which fileId this ws belongs to
      for (const [fileId, connection] of Object.entries(pluginConnections)) {
        if (connection.ws === ws) {
          console.error(`WebSocket connection closed for file ${fileId}`);
          unregisterWebSocketConnection(fileId);
          break;
        }
      }
    },
    onError(event: any, ws: any) {
      console.error('WebSocket error:', event);
      
      // Find and unregister the connection
      for (const [fileId, connection] of Object.entries(pluginConnections)) {
        if (connection.ws === ws) {
          unregisterWebSocketConnection(fileId);
          break;
        }
      }
    }
  });
});