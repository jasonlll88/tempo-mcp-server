#!/bin/bash

# Cursor-specific MCP Server Wrapper Script
# This script sets necessary environment variables and starts the MCP server

# Change to the project directory first
cd "$(dirname "$0")"

# Setup environment variables
export TEMPO_API_TOKEN="your_tempo_api_token_here"
export JIRA_API_TOKEN="your_jira_api_token_here"
export JIRA_EMAIL="your_email@example.com"
export JIRA_BASE_URL="https://your-org.atlassian.net"

# Print environment info (hidden secrets)
echo "Starting Tempo MCP Server with the following configuration:" >&2
echo "TEMPO_API_TOKEN: [configured]" >&2
echo "JIRA_API_TOKEN: [configured]" >&2
echo "JIRA_EMAIL: $JIRA_EMAIL" >&2
echo "JIRA_BASE_URL: $JIRA_BASE_URL" >&2

# Start the server
exec node build/index.js 