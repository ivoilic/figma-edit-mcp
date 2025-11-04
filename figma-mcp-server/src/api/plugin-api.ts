import { Hono } from 'hono';
import type { Context } from 'hono';
import type { UpgradeWebSocket } from 'hono/ws';
import { PluginHealthcheckRequest } from '../types.js';
import {
  registerWebSocketConnection,
  unregisterWebSocketConnection,
  pluginConnections,
  storeVariables
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

      console.error(`[WebSocket] Connection opened for file ${fileId}, plugin ${pluginId}`);
      
      // Store fileId on WebSocket for later retrieval
      (ws as any).fileId = fileId;
      
      // Register the WebSocket connection
      registerWebSocketConnection(fileId, pluginId, ws);
    },
    onMessage(event: any, ws: any) {
      try {
        // Handle incoming messages from plugin
        const data = JSON.parse(event.data.toString());
        console.error('Received message from plugin:', data);
        
        // Handle variable responses
        if (data.type === 'variables-response') {
          console.error('[WebSocket] Received variables-response message');
          console.error('[WebSocket] Message data:', JSON.stringify(data, null, 2));
          
          // Try to get fileId from WebSocket first (more reliable)
          const fileIdFromWs = (ws as any).fileId;
          let fileId: string | null = null;
          
          if (fileIdFromWs) {
            console.error(`[WebSocket] Using fileId from WebSocket: ${fileIdFromWs}`);
            fileId = fileIdFromWs;
          } else {
            // Fallback: Find the fileId for this WebSocket connection
            console.error('[WebSocket] No fileId on WebSocket, searching connections...');
            for (const [fid, connection] of Object.entries(pluginConnections)) {
              if (connection.ws === ws) {
                fileId = fid;
                console.error(`[WebSocket] Found fileId ${fileId} for this WebSocket connection`);
                break;
              }
            }
          }
          
          if (fileId) {
            console.error(`[WebSocket] Storing ${data.variables?.length || 0} variables for file ${fileId}`);
            storeVariables(fileId, data.variables || [], data.collections || []);
            console.error(`[WebSocket] Successfully stored variables for file ${fileId}`);
          } else {
            console.error('[WebSocket] ERROR: Could not determine fileId for WebSocket connection when storing variables');
            console.error('[WebSocket] Available connections:', Object.keys(pluginConnections).join(', '));
          }
        }
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