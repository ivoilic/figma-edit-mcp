import { Message, PluginConnection } from '../types.js';
import type { WebSocket } from 'ws';

// Extended connection info with WebSocket
export interface WebSocketConnection extends PluginConnection {
  ws?: WebSocket;
}

// Manage connections from plugins
export const pluginConnections: Record<string, WebSocketConnection> = {};

// Message queue per file (for messages sent before connection)
export const messageQueues: Record<string, Message[]> = {};

// Variable cache per file (stores variables retrieved from plugins)
export const variableCache: Record<string, {
  variables: any[];
  collections: any[];
  timestamp: Date;
}> = {};

/**
 * Register WebSocket connection for a file
 * @param fileId Figma file ID
 * @param pluginId Plugin ID
 * @param ws WebSocket connection
 */
export function registerWebSocketConnection(
  fileId: string,
  pluginId: string,
  ws: WebSocket
): void {
  pluginConnections[fileId] = {
    pluginId,
    lastSeen: new Date(),
    status: 'connected',
    ws
  };

  // Send any queued messages immediately
  const queuedMessages = messageQueues[fileId] || [];
  if (queuedMessages.length > 0) {
    for (const message of queuedMessages) {
      if (ws.readyState === 1) {
        // WebSocket.OPEN = 1
        ws.send(JSON.stringify(message));
      }
    }
    // Clear queue after sending
    messageQueues[fileId] = [];
  }
}

/**
 * Unregister WebSocket connection for a file
 * @param fileId Figma file ID
 */
export function unregisterWebSocketConnection(fileId: string): void {
  if (pluginConnections[fileId]) {
    pluginConnections[fileId].status = 'pending';
    pluginConnections[fileId].ws = undefined;
  }
}

/**
 * Add message to message queue or send directly via WebSocket
 * @param fileId Figma file ID
 * @param updates Update content
 * @returns Whether successful
 */
export function addToMessageQueue(fileId: string, updates: any): boolean {
  try {
    const connection = pluginConnections[fileId];
    const newMessage: Message = {
      id: Date.now(),
      timestamp: new Date(),
      type: 'update',
      updates
    };

    // If WebSocket is connected, send immediately
    if (connection?.ws && connection.ws.readyState === 1) {
      // WebSocket.OPEN = 1
      connection.ws.send(JSON.stringify(newMessage));
      connection.lastSeen = new Date();
      return true;
    }

    // Otherwise, queue the message
    if (!connection) {
      // Create temporary connection info
      pluginConnections[fileId] = {
        pluginId: 'pending-connection',
        lastSeen: new Date(),
        status: 'pending'
      };
    }

    // Add message to queue
    if (!messageQueues[fileId]) {
      messageQueues[fileId] = [];
    }

    messageQueues[fileId].push(newMessage);

    return true;
  } catch (error) {
    console.error('Error adding message to queue:', error);
    return false;
  }
}

/**
 * Get and remove messages from message queue
 * @param fileId Figma file ID
 * @returns Array of messages
 * @deprecated Use WebSocket connections instead. Kept for backward compatibility.
 */
export function getAndClearMessages(fileId: string): Message[] {
  const messages = messageQueues[fileId] || [];

  if (messages.length > 0) {
    // Clear queue after returning messages
    messageQueues[fileId] = [];
  }

  return messages;
}

/**
 * Store variables for a file
 * @param fileId Figma file ID
 * @param variables Variables data
 */
export function storeVariables(fileId: string, variables: any, collections: any): void {
  console.error(`[storeVariables] Storing ${variables?.length || 0} variables for file ${fileId}`);
  variableCache[fileId] = {
    variables: variables || [],
    collections: collections || [],
    timestamp: new Date()
  };
  console.error(`[storeVariables] Cache updated. Variables:`, variables?.map((v: any) => ({ id: v.id, name: v.name })));
}

/**
 * Get cached variables for a file
 * @param fileId Figma file ID
 * @returns Variables data or null if not cached
 */
export function getCachedVariables(fileId: string): { variables: any[]; collections: any[] } | null {
  const cached = variableCache[fileId];
  if (cached) {
    // Cache is valid for 5 minutes
    const cacheAge = Date.now() - cached.timestamp.getTime();
    if (cacheAge < 5 * 60 * 1000) {
      console.error(`[getCachedVariables] Returning cached variables for ${fileId}: ${cached.variables.length} variables`);
      return {
        variables: cached.variables,
        collections: cached.collections
      };
    } else {
      console.error(`[getCachedVariables] Cache expired for ${fileId}`);
      delete variableCache[fileId];
    }
  } else {
    console.error(`[getCachedVariables] No cache found for ${fileId}`);
  }
  return null;
}

/**
 * Clear variables cache for a file
 * @param fileId Figma file ID
 */
export function clearVariablesCache(fileId: string): void {
  delete variableCache[fileId];
}

/**
 * Get all cached fileIds (for debugging)
 */
export function getCachedFileIds(): string[] {
  return Object.keys(variableCache);
}

/**
 * Check if cache exists for a file (even if empty)
 */
export function hasCache(fileId: string): boolean {
  return fileId in variableCache;
}