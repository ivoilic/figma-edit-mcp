// Configuration from environment variables
export const PORT = parseInt(process.env.PORT || '5678', 10);
export const FALLBACK_PORT = process.env.FALLBACK_PORT ? parseInt(process.env.FALLBACK_PORT, 10) : PORT + 1;
export const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

// Server configuration
export const SERVER_NAME = "figma-mcp-server";
export const SERVER_VERSION = "0.1.0";

// File retrieval tool configuration
export const GET_FILE_TOOL_NAME = "get_file";
export const GET_FILE_TOOL_DESCRIPTION = "Retrieves the contents of a Figma file by its ID";

// Usage information tool configuration
export const USAGE_TOOL_NAME = "get_mcp_tool_usage";
export const USAGE_TOOL_DESCRIPTION = "Get detailed usage information, parameter descriptions, and sample code for MCP tools";

// Node creation tool configuration
export const CREATE_NODE_TOOL_NAME = "create_node";
export const CREATE_NODE_TOOL_DESCRIPTION = "Creates any Figma node type with any properties. Low-level tool for maximum flexibility.";

// Node update tool configuration
export const UPDATE_NODE_TOOL_NAME = "update_node";
export const UPDATE_NODE_TOOL_DESCRIPTION = "Updates any property of an existing Figma node or deletes it. Low-level tool for maximum flexibility.";

// Variable tools configuration
export const GET_VARIABLES_TOOL_NAME = "get_variables";
export const GET_VARIABLES_TOOL_DESCRIPTION = "Retrieves all variables from a Figma file";

export const CREATE_VARIABLE_TOOL_NAME = "create_variable";
export const CREATE_VARIABLE_TOOL_DESCRIPTION = "Creates a new variable in a Figma file";

export const UPDATE_VARIABLE_TOOL_NAME = "update_variable";
export const UPDATE_VARIABLE_TOOL_DESCRIPTION = "Updates an existing variable in a Figma file";

export const DELETE_VARIABLE_TOOL_NAME = "delete_variable";
export const DELETE_VARIABLE_TOOL_DESCRIPTION = "Deletes a variable from a Figma file";