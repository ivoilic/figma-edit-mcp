import { Message, PluginConnection } from '../types.js';

// Manage connections from plugins
export const pluginConnections: Record<string, PluginConnection> = {};

// Message queue per file
export const messageQueues: Record<string, Message[]> = {};

/**
 * Add message to message queue
 * @param fileId Figma file ID
 * @param updates Update content
 * @returns Whether successful
 */
export function addToMessageQueue(fileId: string, updates: any): boolean {
  try {
    // Check if plugin is connected
    if (!pluginConnections[fileId]) {
      // Create queue even if no connection (plugin may connect later)
      console.error(`Warning: No plugin currently connected for file ${fileId}, but will queue message anyway`);
      
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
    
    const newMessage: Message = {
      id: Date.now(),
      timestamp: new Date(),
      type: 'update',
      updates
    };
    
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
 */
export function getAndClearMessages(fileId: string): Message[] {
  const messages = messageQueues[fileId] || [];
  
  if (messages.length > 0) {
    // Clear queue after returning messages
    messageQueues[fileId] = [];
  }
  
  return messages;
}