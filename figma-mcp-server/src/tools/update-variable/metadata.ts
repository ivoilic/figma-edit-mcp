import { ToolUsageInfo } from '../../types.js';

/**
 * Usage information for update_variable tool
 */
export const updateVariableMetadata: ToolUsageInfo = {
  name: "update_variable",
  description: "Updates an existing variable in a Figma file",
  inputSchema: {
    type: "object",
    properties: {
      fileId: {
        type: "string",
        description: "Figma file ID"
      },
      variableId: {
        type: "string",
        description: "ID of the variable to update"
      },
      name: {
        type: "string",
        description: "Optional: New name for the variable"
      },
      valuesByMode: {
        type: "object",
        description: "Optional: Updated values for each mode. Key is mode ID, value depends on variableType",
        additionalProperties: true
      },
      description: {
        type: "string",
        description: "Optional: New description for the variable"
      },
      scopes: {
        type: "array",
        items: {
          type: "string",
          enum: ["ALL_SCOPES", "TEXT_CONTENT", "CORNER_RADIUS", "WIDTH_HEIGHT", "GAP", "ALL_FILLS", "FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_FLOAT", "EFFECT_FLOAT", "EFFECT_COLOR", "OPACITY", "FONT_STYLE", "FONT_FAMILY", "FONT_SIZE", "LINE_HEIGHT", "LETTER_SPACING", "PARAGRAPH_SPACING", "PARAGRAPH_INDENT", "TRANSFORM", "STROKE_COLOR", "FONT_WEIGHT"]
        },
        description: "Optional: Updated scopes where this variable can be used"
      }
    },
    required: ["fileId", "variableId"]
  },
  examples: [
    {
      title: "Update Variable Name",
      description: "Update the name of an existing variable",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>update_variable</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID",
  "variableId": "VARIABLE_ID",
  "name": "Updated Variable Name"
}
</arguments>
</use_mcp_tool>`
    },
    {
      title: "Update Variable Values",
      description: "Update the values of a variable for specific modes",
      code: `<use_mcp_tool>
<server_name>figma-mcp-server</server_name>
<tool_name>update_variable</tool_name>
<arguments>
{
  "fileId": "YOUR_FIGMA_FILE_ID",
  "variableId": "VARIABLE_ID",
  "valuesByMode": {
    "MODE_ID_1": { "r": 1.0, "g": 0.0, "b": 0.0, "a": 1.0 }
  }
}
</arguments>
</use_mcp_tool>`
    }
  ],
  notes: [
    "Variable IDs can be obtained from get_variables tool.",
    "Only provide the properties you want to update.",
    "Values must match the variable type (COLOR, FLOAT, STRING, or BOOLEAN)."
  ]
};
