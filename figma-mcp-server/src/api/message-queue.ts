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