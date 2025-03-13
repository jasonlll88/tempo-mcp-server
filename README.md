# Tempo MCP Server

A Model Context Protocol (MCP) server for managing Tempo worklogs in Jira. This server provides tools for tracking time and managing worklogs through Tempo's API, making it accessible through Claude, Cursor and other MCP-compatible clients.

[![npm version](https://img.shields.io/npm/v/tempo-mcp-server.svg)](https://www.npmjs.com/package/tempo-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Retrieve Worklogs**: Get all worklogs for a specific date range
- **Create Worklog**: Log time against Jira issues
- **Bulk Create**: Create multiple worklogs in a single operation
- **Edit Worklog**: Modify time spent, dates, and descriptions
- **Delete Worklog**: Remove existing worklogs

## System Requirements

- Node.js 18+ (LTS recommended)
- Jira Cloud instance
- Tempo API token
- Jira API token

## Usage Options

There are two main ways to use this MCP server:

1. **NPX (Recommended for most users)**: Run directly without installation
2. **Local Clone**: Clone the repository for development or customization

## Option 1: NPX Usage

The easiest way to use this server is via npx without installation:

```bash
npx tempo-mcp-server --tempo-token=your_tempo_token --jira-token=your_jira_token --jira-email=your@email.com --jira-base-url=https://your-org.atlassian.net
```

### Connecting to Claude Desktop (NPX Method)

1. Open your MCP client configuration file:
   - Claude Desktop (macOS): `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Claude Desktop (Windows): `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the following configuration:

```json
{
  "mcpServers": {
    "Jira_Tempo": {
      "command": "npx",
      "args": [
        "tempo-mcp-server",
        "--tempo-token=your_tempo_token",
        "--jira-token=your_jira_token",
        "--jira-email=your@email.com",
        "--jira-base-url=https://your-org.atlassian.net"
      ]
    }
  }
}
```

3. Restart your Claude Desktop client

## Option 2: Local Repository Clone

### Installation

```bash
# Clone the repository
git clone https://github.com/ivelin-web/tempo-mcp-server.git
cd tempo-mcp-server

# Install dependencies
npm install

# Build TypeScript files
npm run build
```

### Local Configuration

#### Using the Wrapper Script (Recommended for local usage)

The easiest way to run the server locally is to use the included wrapper script:

1. Edit the `tempo-mcp-wrapper.sh` file and update your API tokens and credentials:

```bash
# Update these lines with your actual credentials
export TEMPO_API_TOKEN="your_tempo_api_token_here"
export JIRA_API_TOKEN="your_jira_api_token_here"
export JIRA_EMAIL="your_email@example.com"
export JIRA_BASE_URL="https://your-org.atlassian.net"
```

2. Make the script executable:

```bash
chmod +x tempo-mcp-wrapper.sh
```

### Connecting to Claude Desktop (Local Method)

1. Open your MCP client configuration file
2. Add the following configuration:

```json
{
  "mcpServers": {
    "Jira_Tempo": {
      "command": "/bin/bash",
      "args": [
        "/ABSOLUTE/PATH/TO/tempo-mcp-wrapper.sh"
      ]
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO/tempo-mcp-wrapper.sh` with the actual path to your wrapper script.

3. Restart your Claude Desktop client

## Getting API Tokens

1. **Tempo API Token**: 
   - Go to Tempo > Settings > API Integration
   - Create a new API token with appropriate permissions

2. **Jira API Token**:
   - Go to [Atlassian API tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Create a new API token for your account

## Command Line Options

When using the server directly (not through the wrapper script), you can provide configuration via command line:

```bash
npx tempo-mcp-server --tempo-token=your_tempo_token --jira-token=your_jira_token --jira-email=your@email.com --jira-base-url=https://your-org.atlassian.net
```

Short form options are also available:

```bash
npx tempo-mcp-server -t your_tempo_token -j your_jira_token -e your@email.com -u https://your-org.atlassian.net
```

Run with `--help` or `-h` to see all available options.

## Available Tools

### retrieveWorklogs

Fetches worklogs for the configured user between start and end dates.

```
Parameters:
- startDate: String (YYYY-MM-DD)
- endDate: String (YYYY-MM-DD)
```

### createWorklog

Creates a new worklog for a specific Jira issue.

```
Parameters:
- issueKey: String (e.g., "PROJECT-123")
- timeSpentHours: Number (positive)
- date: String (YYYY-MM-DD)
- description: String (optional)
```

### bulkCreateWorklogs

Creates multiple worklogs in a single operation.

```
Parameters:
- worklogEntries: Array of {
    issueKey: String
    timeSpentHours: Number
    date: String (YYYY-MM-DD)
    description: String (optional)
  }
```

### editWorklog

Modifies an existing worklog.

```
Parameters:
- worklogId: String
- timeSpentHours: Number (positive)
- description: String (optional)
- date: String (YYYY-MM-DD, optional)
```

### deleteWorklog

Removes an existing worklog.

```
Parameters:
- worklogId: String
```

## Project Structure

```
tempo-mcp-server/
├── src/                  # Source code
│   ├── config.ts         # Configuration management
│   ├── index.ts          # MCP server implementation
│   ├── jira.ts          # Jira API integration
│   ├── tools.ts         # Tool implementations
│   ├── types.ts         # TypeScript types and schemas
│   └── utils.ts         # Utility functions
├── build/               # Compiled JavaScript (generated)
├── tempo-mcp-wrapper.sh # Startup wrapper script
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project metadata and scripts
```

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build TypeScript files
npm run build

# Run the compiled version
npm start

# Run the MCP Inspector for debugging
npm run inspect
```

## Troubleshooting

If you encounter issues:

1. Check that all environment variables are properly set
2. Verify your Jira and Tempo API tokens have the correct permissions
3. Check the console output for error messages
4. Try running with the inspector: `npm run inspect`

## License

[MIT](LICENSE)

## Credits

This server implements the [Model Context Protocol](https://modelcontextprotocol.io/) specification created by Anthropic.