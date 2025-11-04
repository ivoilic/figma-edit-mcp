const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Figma MCP Assistant</title>
  <style>
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 0;
      background: #F5F5F5;
      color: #333;
      line-height: 1.5;
    }
    
    .container {
      padding: 24px;
      max-width: 500px;
    }
    
    .header {
      margin-bottom: 24px;
    }
    
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #1A1A1A;
    }
    
    .header p {
      margin: 0;
      font-size: 13px;
      color: #666;
    }
    
    .status-card {
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .status-dot.connected {
      background-color: #18A957;
      box-shadow: 0 0 0 3px rgba(24, 169, 87, 0.2);
    }
    
    .status-dot.disconnected {
      background-color: #F24822;
      box-shadow: 0 0 0 3px rgba(242, 72, 34, 0.2);
    }
    
    .status-text {
      font-weight: 500;
      font-size: 14px;
    }
    
    .status-text.connected {
      color: #18A957;
    }
    
    .status-text.disconnected {
      color: #F24822;
    }
    
    .setup-instructions {
      background: #FFF9E6;
      border: 1px solid #FFE066;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    
    .setup-instructions.hidden {
      display: none;
    }
    
    .setup-instructions h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #1A1A1A;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .setup-instructions .icon {
      font-size: 18px;
    }
    
    .setup-instructions ol {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: #333;
    }
    
    .setup-instructions li {
      margin-bottom: 8px;
    }
    
    .setup-instructions code {
      background: rgba(0, 0, 0, 0.05);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 12px;
    }
    
    .setup-instructions .highlight {
      background: #FFE066;
      padding: 2px 4px;
      border-radius: 3px;
      font-weight: 500;
    }
    
    .button-group {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    button {
      flex: 1;
      background-color: #18A0FB;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 10px 16px;
      font-weight: 500;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    button:hover {
      background-color: #0D8CE6;
    }
    
    button:active {
      transform: scale(0.98);
    }
    
    button.secondary {
      background-color: white;
      color: #333;
      border: 1px solid #E5E5E5;
    }
    
    button.secondary:hover {
      background-color: #F9F9F9;
    }
    
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .log-section {
      margin-top: 20px;
    }
    
    .log-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: white;
      border: 1px solid #E5E5E5;
      border-radius: 6px;
      padding: 10px 12px;
      cursor: pointer;
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
      transition: all 0.2s;
    }
    
    .log-toggle:hover {
      background: #F9F9F9;
      border-color: #D0D0D0;
    }
    
    .log-toggle-icon {
      transition: transform 0.2s;
      font-size: 12px;
    }
    
    .log-toggle-icon.expanded {
      transform: rotate(180deg);
    }
    
    .log {
      display: none;
      height: 200px;
      overflow-y: auto;
      border: 1px solid #E5E5E5;
      border-radius: 6px;
      padding: 12px;
      background: #1A1A1A;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 11px;
      line-height: 1.6;
    }
    
    .log.expanded {
      display: block;
    }
    
    .log-entry {
      margin-bottom: 6px;
      word-break: break-word;
      color: #D4D4D4;
    }
    
    .log-entry.error {
      color: #FF6B6B;
    }
    
    .log-entry.success {
      color: #51CF66;
    }
    
    .log-entry.debug {
      color: #74C0FC;
    }
    
    .timestamp {
      color: #666;
      margin-right: 8px;
    }
    
    .success-message {
      background: #E9F9EE;
      border: 1px solid #18A957;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      display: none;
    }
    
    .success-message.visible {
      display: block;
    }
    
    .success-message h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: #18A957;
    }
    
    .success-message p {
      margin: 0;
      font-size: 13px;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Figma MCP Assistant</h1>
      <p>Connect your AI assistant to edit Figma files</p>
    </div>

    <div class="status-card">
      <div class="status-indicator">
        <div id="statusDot" class="status-dot disconnected"></div>
        <span id="statusText" class="status-text disconnected">Disconnected</span>
      </div>
      <div id="successMessage" class="success-message">
        <h3>✓ Connected Successfully</h3>
        <p>Your AI assistant can now edit this Figma file. Try asking it to create or modify design elements!</p>
      </div>
    </div>

    <div id="setupInstructions" class="setup-instructions">
      <h3>
        <span class="icon">⚙️</span>
        Setup Required
      </h3>
      <ol>
        <li>Open your AI tool settings (<span class="highlight">Cursor</span>, <span class="highlight">Claude Desktop</span>, or similar)</li>
        <li>Add the MCP server configuration</li>
        <li>Use the command: <code>env FIGMA_ACCESS_TOKEN=your_token node /path/to/figma-mcp-server/build/index.js</code></li>
        <li>Restart your AI tool</li>
        <li>Click "Connect" below once your MCP server is running</li>
      </ol>
      <p style="margin-top: 12px; margin-bottom: 0; font-size: 12px; color: #666;">
        💡 <strong>Tip:</strong> Make sure your Figma Personal Access Token is set in the environment variable.
      </p>
    </div>

    <div class="button-group">
      <button id="healthcheck">Connect to MCP Server</button>
      <button id="cancel" class="secondary">Close</button>
    </div>

    <div class="log-section">
      <div class="log-toggle" id="logToggle">
        <span>Connection Log</span>
        <span class="log-toggle-icon">▼</span>
      </div>
      <div class="log" id="log"></div>
    </div>
  </div>

  <script>
    // Elements
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const logEl = document.getElementById('log');
    const logToggle = document.getElementById('logToggle');
    const setupInstructions = document.getElementById('setupInstructions');
    const successMessage = document.getElementById('successMessage');
    let isLogExpanded = false;

    // WebSocket connection management
    const MCP_SERVER_URL = 'http://localhost:5678';
    let ws = null;
    let reconnectTimeout = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 1000;

    // Get WebSocket URL from HTTP URL
    function getWebSocketUrl() {
      const httpUrl = MCP_SERVER_URL.replace(/^http/, 'ws');
      return httpUrl + '/plugin/ws';
    }

    // Connect to MCP server via WebSocket
    function connectWebSocket(pluginId, fileId) {
      try {
        addLogEntry('Connecting to MCP server via WebSocket...', 'debug');
        
        // Close existing connection if any
        if (ws) {
          ws.close();
          ws = null;
        }

        const wsUrl = getWebSocketUrl() + '?fileId=' + encodeURIComponent(fileId) + '&pluginId=' + encodeURIComponent(pluginId);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          addLogEntry('Connected to MCP server via WebSocket (File ID: ' + fileId + ')', 'success');
          updateStatus(true, fileId);
          parent.postMessage({ pluginMessage: { type: 'connection-success', fileId } }, '*');
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'update') {
              // Log tool calls from updates
              if (message.updates && message.updates.updates && Array.isArray(message.updates.updates)) {
                for (const update of message.updates.updates) {
                  if (update.type === 'createNode') {
                    addLogEntry('create_node called', 'info');
                  } else if (update.type === 'updateNode') {
                    addLogEntry('update_node called', 'info');
                  } else if (update.type === 'deleteNode') {
                    addLogEntry('delete_node called', 'info');
                  } else if (update.type === 'getVariables') {
                    addLogEntry('get_variables called', 'info');
                  } else if (update.type === 'createVariable') {
                    addLogEntry('create_variable called', 'info');
                  } else if (update.type === 'updateVariable') {
                    addLogEntry('update_variable called', 'info');
                  } else if (update.type === 'deleteVariable') {
                    addLogEntry('delete_variable called', 'info');
                  }
                }
              }
              
              console.log('[UI] Received update message:', JSON.stringify(message, null, 2));
              
              try {
                // Forward update to plugin code
                const pluginMessage = { 
                  type: 'websocket-update', 
                  updates: message.updates 
                };
                
                parent.postMessage({ pluginMessage }, '*');
              } catch (error) {
                addLogEntry('Error calling postMessage: ' + error, 'error');
              }
            }
          } catch (error) {
            addLogEntry('Error parsing WebSocket message: ' + error, 'error');
          }
        };

        ws.onclose = (event) => {
          addLogEntry('WebSocket connection closed', 'error');
          updateStatus(false);
          parent.postMessage({ pluginMessage: { type: 'connection-closed' } }, '*');
          ws = null;

          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = RECONNECT_DELAY * reconnectAttempts;
            addLogEntry('Reconnecting in ' + delay + 'ms... (attempt ' + reconnectAttempts + '/' + MAX_RECONNECT_ATTEMPTS + ')', 'debug');
            
            reconnectTimeout = setTimeout(() => {
              connectWebSocket(pluginId, fileId);
            }, delay);
          } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            addLogEntry('Max reconnection attempts reached', 'error');
            parent.postMessage({ 
              pluginMessage: { 
                type: 'connection-error', 
                error: 'Max reconnection attempts reached' 
              } 
            }, '*');
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          addLogEntry('WebSocket connection error', 'error');
        };
      } catch (error) {
        console.error('Failed to connect to MCP server:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        addLogEntry('Failed to connect to MCP server: ' + errorMessage, 'error');
        parent.postMessage({ pluginMessage: { type: 'connection-error', error: errorMessage } }, '*');
      }
    }

    // Disconnect WebSocket
    function disconnectWebSocket() {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      if (ws) {
        ws.close(1000, 'Normal closure');
        ws = null;
      }
      
      reconnectAttempts = 0;
    }

    // Log display function
    function addLogEntry(message, type = 'info') {
      const entry = document.createElement('div');
      entry.className = 'log-entry ' + type;
      const timestamp = new Date().toLocaleTimeString();
      entry.innerHTML = '<span class="timestamp">[' + timestamp + ']</span>' + escapeHtml(message);
      logEl.appendChild(entry);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Initial log
    addLogEntry('Plugin initialized', 'debug');

    // Status update
    function updateStatus(connected, fileId = null) {
      if (connected) {
        statusDot.className = 'status-dot connected';
        statusText.className = 'status-text connected';
        statusText.textContent = 'Connected to MCP Server';
        setupInstructions.classList.add('hidden');
        successMessage.classList.add('visible');
        if (fileId) {
          addLogEntry('Connected to MCP server (File ID: ' + fileId + ')', 'success');
        }
      } else {
        statusDot.className = 'status-dot disconnected';
        statusText.className = 'status-text disconnected';
        statusText.textContent = 'Disconnected';
        setupInstructions.classList.remove('hidden');
        successMessage.classList.remove('visible');
      }
    }

    // Log toggle
    logToggle.addEventListener('click', () => {
      isLogExpanded = !isLogExpanded;
      logEl.classList.toggle('expanded', isLogExpanded);
      const icon = logToggle.querySelector('.log-toggle-icon');
      icon.classList.toggle('expanded', isLogExpanded);
    });

    // Event listeners
    document.getElementById('healthcheck').addEventListener('click', () => {
      parent.postMessage({ pluginMessage: { type: 'register' } }, '*');
      addLogEntry('Connecting to MCP server...', 'debug');
    });

    document.getElementById('cancel').addEventListener('click', () => {
      parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
    });

    // Process messages from plugin
    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      
      if (!message) return;
      
      if (message.type === 'connect-websocket') {
        // Plugin is asking UI to connect WebSocket
        connectWebSocket(message.pluginId, message.fileId);
      } else if (message.type === 'disconnect-websocket') {
        // Plugin is asking UI to disconnect WebSocket
        disconnectWebSocket();
      } else if (message.type === 'connection-success') {
        updateStatus(true, message.fileId);
      } else if (message.type === 'connection-error') {
        updateStatus(false);
        const errorMsg = typeof message.error === 'object' 
          ? 'Connection failed - Make sure your MCP server is running and configured in your AI tool'
          : message.error;
        addLogEntry(errorMsg, 'error');
      } else if (message.type === 'connection-closed') {
        updateStatus(false);
        addLogEntry('Connection closed', 'error');
      } else if (message.type === 'log') {
        addLogEntry(message.message);
      } else if (message.type === 'error') {
        addLogEntry(message.message, 'error');
      } else if (message.type === 'send-variables-response') {
        // Forward variables response to server via WebSocket
        console.log('[UI] Received send-variables-response from plugin:', {
          variableCount: message.variables?.length || 0,
          collectionCount: message.collections?.length || 0
        });
        if (ws && ws.readyState === WebSocket.OPEN) {
          const response = {
            type: 'variables-response',
            variables: message.variables || [],
            collections: message.collections || []
          };
          console.log('[UI] Sending variables response to server:', JSON.stringify(response, null, 2));
          ws.send(JSON.stringify(response));
          const varCount = message.variables ? message.variables.length : 0;
          addLogEntry('Sent ' + varCount + ' variables to server', 'success');
        } else {
          console.error('[UI] WebSocket not connected, cannot send variables. readyState:', ws?.readyState);
          addLogEntry('WebSocket not connected, cannot send variables', 'error');
        }
      }
    };
  </script>
</body>
</html>
`;

export default html; 