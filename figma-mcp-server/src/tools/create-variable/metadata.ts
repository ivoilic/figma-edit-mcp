import { ToolUsageInfo } from '../../types.js';

/**
 * Usage information for create_variable tool
 */
export const createVariableMetadata: ToolUsageInfo = {
  name: "create_variable",
  description: "Creates a new variable in a Figma file. Variables are reusable design tokens.",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "Figma file ID"
      },
      name: {
        type: "string",
        description: "Name of the variable"
      },
      variableType: {
        type: "string",
        enum: ["COLOR", "FLOAT", "STRING", "BOOLEAN"],
        description: "Type of the variable"
      },
      valuesByMode: {
        type: "object",
        description: "Values for each mode. Key is mode ID, value depends on variableType. For COLOR: {r, g, b, a}, for FLOAT: number, for STRING: string, for BOOLEAN: boolean",
        additionalProperties: true
      },
      collectionId: {
        type: "string",
        description: "Optional: ID of the variable collection to add this variable to"
      },
      description: {
        type: "string",
        description: "Optional: Description of the variable"
      },
      scopes: {
        type: "array",
        items: {
          type: "string",
          enum: ["ALL_SCOPES", "TEXT_COLOR", "BG_COLOR", "FILL_COLOR", "STROKE_COLOR", "EFFECT_COLOR", "OPACITY", "FONT_FAMILY", "FONT_SIZE", "FONT_WEIGHT", "LINE_HEIGHT", "LETTER_SPACING", "PARAGRAPH_SPACING", "PARAGRAPH_INDENT", "BORDER_RADIUS", "SPACING", "DIMENSION", "GAP", "SIZING_WIDTH", "SIZING_HEIGHT"]
        },
        description: "Optional: Scopes where this variable can be used"
      }
    },
    required: ["fileId", "name", "variableType", "valuesByMode"]
  },
  examples: [
    {
      title: "Create a Color Variable",
      description: "Create a color variable with values for different modes",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>create_variable</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID",
  "name": "Primary Color",
  "variableType": "COLOR",
  "valuesByMode": {
    "MODE_ID_1": { "r": 0.2, "g": 0.6, "b": 1.0, "a": 1.0 }
  },
  "scopes": ["FILL_COLOR", "TEXT_COLOR"]
}
</arguments>
</use_mcp_tool>`
    },
    {
      title: "Create a Spacing Variable",
      description: "Create a float variable for spacing",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>create_variable</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID",
  "name": "Spacing Large",
  "variableType": "FLOAT",
  "valuesByMode": {
    "MODE_ID_1": 24
  },
  "scopes": ["SPACING"]
}
</arguments>
</use_mcp_tool>`
    }
  ],
  notes: [
    "Variables must have values for at least one mode.",
    "Mode IDs can be obtained from get_variables or by inspecting the file.",
    "COLOR variables use RGBA values (0-1 range).",
    "Scopes define where the variable can be applied (e.g., FILL_COLOR, TEXT_COLOR, etc.).",
    "If collectionId is not provided, the variable will be added to the default collection."
  ]
};
