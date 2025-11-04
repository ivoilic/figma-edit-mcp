# Figma Edit MCP 🛠️🎨

A tool for editing Figma files via MCP.
```
⚠️ This is a prototype! Use at your own risk! ⚠️
```
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
# or
pnpm build:server
# and
pnpm build:plugin
```

1. **Install the Figma Plugin**

To install the Figma plugin locally in development mode:

1. Open the Figma desktop app
2. From the menu in the top right, select "Plugins" → "Development" → "Import plugin from manifest..."
3. Select the figma-plugin/manifest.json file
4. The plugin will be installed in development mode

### MCP Configuration

#### For Cursor

To use this plugin with Cursor, you need to add the MCP server configuration to your MCP settings file (typically `~/.cursor/mcp.json` or similar).

**Note:** You can currently only have this enabled in one Cursor window at a time!

1. Add the following JSON snippet to your MCP servers configuration:

```json
  "figma-edit-mcp": {
    "command": "node",
    "args": [
      "/path/to/figma-edit-mcp/figma-mcp-server/build/index.js"
    ],
    "env": {
      "FIGMA_ACCESS_TOKEN": "your_figma_personal_access_token"
    }
  }
```

2. Replace `/path/to/figma-edit-mcp` with the actual path to the repository.
3. Replace `your_figma_personal_access_token` with your Figma Personal Access Token.

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
3. The plugin will launch and connect to the MCP server if it is running


### Tools

- `get_mcp_tool_usage`: Tool to get usage information for MCP tools
- `get_file`: Tool to retrieve the contents of a Figma file (including node IDs for use with update_node)
- `create_node`: Create any Figma node type with any properties. Provides maximum flexibility for creating nodes at the lowest level. Supports using variables in properties.
- `update_node`: Update any property of an existing Figma node or delete it. Provides maximum flexibility for modifying nodes at the lowest level. Supports using variables in properties.
- `get_variables`: Retrieve all variables from a Figma file. Variables are reusable design tokens.
- `create_variable`: Create a new variable in a Figma file. Supports COLOR, FLOAT, STRING, and BOOLEAN types.
- `update_variable`: Update an existing variable (name, values, description, scopes).
- `delete_variable`: Delete a variable from a Figma file.

### Note
Real design should done by humans who care about their craft. AI should only be used to help with tedious tasks.

## Legal

Based on [figma-edit-mcp](https://github.com/asamuzak09/figma-edit-mcp) by asamuzak

Released under the [ISC License](https://github.com/ivoilic/figma-edit-mcp/blob/main/LICENSE)

Copyright © 2025 by [Ivo Ilić](https://www.ivoilic.com)
<div style="font-size:0.75em;">
This software is in no way endorsed by, licensed by, or officially associated in any way with Figma, Inc.
<br/><br/>
The maintainers of this repo make no claim to the ownership of the brand name "Figma". The name is used purely to denote this softwares compatibility with the Figma platform.
<br/><br/>
Usage of this software could potentially violate Figma's terms of service or end user license agreement. Use this software at your own risk.
</div>