import { MCP_SERVER_URL } from '../config/constants';
import { logToUI } from '../utils/logger';

// WebSocket connection is now handled by the UI (which has access to WebSocket API)
// The plugin code communicates with the UI via postMessage

// Register plugin with MCP server (still useful for healthcheck)
export async function healthcheckWithServer(
  pluginId: string,
  fileId: string
): Promise<void> {
  try {
    logToUI('Registering with MCP server...');
    const response = await fetch(`${MCP_SERVER_URL}/plugin/healthcheck`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pluginId,
        fileId,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Server responded with ${response.status}: ${response.statusText}`
      );
    }

    // After healthcheck, ask UI to connect via WebSocket
    figma.ui.postMessage({ 
      type: 'connect-websocket', 
      pluginId, 
      fileId 
    });
  } catch (error: unknown) {
    console.error('Failed to register with MCP server:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    logToUI(`Failed to register with MCP server: ${errorMessage}`, 'error');
    figma.ui.postMessage({ type: 'connection-error', error: errorMessage });
  }
}

// Legacy function names for backward compatibility
export function startPolling(): void {
  // No-op, WebSocket is handled by UI
}

export function stopPolling(): void {
  // Ask UI to disconnect WebSocket
  figma.ui.postMessage({ type: 'disconnect-websocket' });
}

