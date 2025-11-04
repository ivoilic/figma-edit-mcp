# Figma Edit MCP

A tool for editing Figma files via MCP.
Add text, shapes, frames, and more through MCP.

## Requirements

- Node.js v20.0.0 or higher
- pnpm v8.0.0 or higher

## Installation

### Setup Instructions

1. **Clone the Repository**

```bash
git clone https://github.com/ivoilic/figma-edit-mcp.git
cd figma-edit-mcp
```

2. **Install Dependencies**

```bash
pnpm install
```

This command installs dependencies for all workspaces.

3. **Build the Project**

```bash
pnpm build
```

This command builds both the figma-mcp-server and figma-plugin workspaces.

4. **Install the Figma Plugin**

To install the Figma plugin locally in development mode:

1. Open the Figma desktop app
2. From the menu in the top right, select "Plugins" → "Development" → "Import plugin from manifest..."
3. Select the figma-plugin/manifest.json file
4. The plugin will be installed in development mode

### MCP Configuration

#### For Cursor

To use this plugin with Cursor, you need to add the MCP server configuration:

1. Click "Add MCP Server"
2. Select "command" for "Type"
3. Enter the following for "Command":

```
env FIGMA_ACCESS_TOKEN=your_figma_personal_access_token node /path/to/figma-edit-mcp/figma-mcp-server/build/index.js
```

Replace `/path/to/figma-edit-mcp` with the actual path to the repository.
Replace `your_figma_personal_access_token` with your Figma Personal Access Token.

### How to Get a Figma Personal Access Token

1. Log in to Figma
2. Click on your profile icon in the top right
3. Select "Settings"
4. Go to the "Personal access tokens" section in the "Account" tab
5. Click "Create a new personal access token"
6. Enter a name for the token and click "Create token"
7. Copy the displayed token (note that this token will only be shown once)

## Usage

### Using the Figma Plugin

1. Open Figma
2. From the menu in the top right, select "Plugins" → "Development" → "Figma MCP Plugin"
3. The plugin will launch and connect to the MCP server

## Main Features

### Tools

#### Low-Level Tools (Recommended for AI)

- **create_node**: Create any Figma node type with any properties. Provides maximum flexibility for creating nodes at the lowest level. Supports using variables in properties.
- **update_node**: Update any property of an existing Figma node or delete it. Provides maximum flexibility for modifying nodes at the lowest level. Supports using variables in properties.
- **get_variables**: Retrieve all variables from a Figma file. Variables are reusable design tokens.
- **create_variable**: Create a new variable in a Figma file. Supports COLOR, FLOAT, STRING, and BOOLEAN types.
- **update_variable**: Update an existing variable (name, values, description, scopes).
- **delete_variable**: Delete a variable from a Figma file.

#### File and Information Tools

- **get_file**: Tool to retrieve the contents of a Figma file (including node IDs for use with update_node)
- **get_mcp_tool_usage**: Tool to get usage information for MCP tools

### Variable Tools

- **get_variables**: Retrieve all variables from a Figma file
- **create_variable**: Create a new variable (COLOR, FLOAT, STRING, or BOOLEAN type)
- **update_variable**: Update an existing variable's properties
- **delete_variable**: Delete a variable from a file

### Using Variables in Nodes

Variables can be used in node properties like fills and strokes. Use the following format:
```json
{
  "fills": [
    {
      "type": "VARIABLE",
      "variableId": "VARIABLE_ID"
    }
  ]
}
```

Get variable IDs using the `get_variables` tool.

### Supported Node Types (create_node)

- **FRAME**: Create frames used as backgrounds or containers
- **TEXT**: Create text elements (titles, descriptions, etc.)
- **RECTANGLE**: Create rectangles (buttons, cards, etc.)
- **ELLIPSE**: Create ellipses (icons, decorations, etc.)
- **LINE**: Create lines (dividers, arrows, etc.)
- **VECTOR**: Create vector shapes
- **STAR**: Create star shapes
- **POLYGON**: Create polygon shapes
- **GROUP**: Create groups
- **COMPONENT**: Create reusable components
- **COMPONENT_SET**: Create component sets
- **SECTION**: Create sections
- And more...

