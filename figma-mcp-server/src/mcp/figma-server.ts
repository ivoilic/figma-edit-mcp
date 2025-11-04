import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import {
  SERVER_NAME,
  SERVER_VERSION,
  GET_FILE_TOOL_NAME,
  GET_FILE_TOOL_DESCRIPTION,
  USAGE_TOOL_NAME,
  USAGE_TOOL_DESCRIPTION,
  CREATE_NODE_TOOL_NAME,
  CREATE_NODE_TOOL_DESCRIPTION,
  UPDATE_NODE_TOOL_NAME,
  UPDATE_NODE_TOOL_DESCRIPTION
} from '../config/index.js';
import { getToolHandler, toolUsageRegistry } from '../tools/index.js';

/**
 * Figma MCP Server class
 */
export class FigmaServer {
  private server: Server;
  private isRunning: boolean = false;

  constructor() {
    this.server = new Server({
      name: SERVER_NAME,
      version: SERVER_VERSION
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.setupHandlers();
    this.setupErrorHandling();
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    // Individual SIGINT handlers are not set here, managed centrally in index.ts
  }

  /**
   * Setup handlers
   */
  private setupHandlers(): void {
    this.setupToolHandlers();
  }

  /**
   * Setup tool handlers
   */
  private setupToolHandlers(): void {
    // Tool list handler
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => ({
        tools: [
          // create_node tool (low-level)
          {
            name: CREATE_NODE_TOOL_NAME,
            description: CREATE_NODE_TOOL_DESCRIPTION,
            inputSchema: toolUsageRegistry["create_node"].inputSchema
          },
          // update_node tool (low-level)
          {
            name: UPDATE_NODE_TOOL_NAME,
            description: UPDATE_NODE_TOOL_DESCRIPTION,
            inputSchema: toolUsageRegistry["update_node"].inputSchema
          },
          // get_file tool
          {
            name: GET_FILE_TOOL_NAME,
            description: GET_FILE_TOOL_DESCRIPTION,
            inputSchema: toolUsageRegistry["get_file"].inputSchema
          },
          // get_mcp_tool_usage tool
          {
            name: USAGE_TOOL_NAME,
            description: USAGE_TOOL_DESCRIPTION,
            inputSchema: toolUsageRegistry["get_mcp_tool_usage"].inputSchema
          }
        ]
      })
    );

    // Tool call handler
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const toolName = request.params.name;
        const handler = getToolHandler(toolName);
        
        if (!handler) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${toolName}`
          );
        }
        
        return handler(request.params.arguments);
      }
    );
  }

  /**
   * Start the server
   */
  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.isRunning = true;
    console.error("Figma MCP server running on stdio");
  }

  /**
   * Shutdown the server
   * Public method to properly shut down the server from outside
   */
  async shutdown(): Promise<void> {
    if (this.isRunning) {
      await this.server.close();
      this.isRunning = false;
      console.error("Figma MCP server shut down");
    }
  }

  /**
   * Get server running status
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }
}