import axios from 'axios';
import { getIssueKeyById } from './jira.js';

/**
 * Standard error handling for API errors
 * Extracts the most useful error message from Axios errors
 */
export function formatError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as any)?.message || error.message;
  }
  return (error as Error).message;
}

/**
 * Get issue keys for worklogs
 * Maps Jira issue IDs to their corresponding issue keys
 */
export async function getIssueKeysMap(worklogs: any[]): Promise<Record<string, string>> {
  // Extract unique issue IDs
  const uniqueIssueIds = [...new Set(
    worklogs
      .map(worklog => worklog.issue?.id)
      .filter(id => id != null)
  )];
  
  if (uniqueIssueIds.length === 0) return {};
  
  // Create issue ID to key map
  const issueIdToKeyMap: Record<string, string> = {};
  
  // Fetch issue keys in parallel
  await Promise.all(uniqueIssueIds.map(async (issueId) => {
    try {
      const issueKey = await getIssueKeyById(issueId);
      issueIdToKeyMap[issueId] = issueKey;
    } catch (error) {
      console.error(`Could not get key for issue ID ${issueId}: ${(error as Error).message}`);
    }
  }));
  
  return issueIdToKeyMap;
}

/**
 * Print help message for the CLI
 */
export function printHelp(): void {
  console.log(`
Tempo MCP Server - A Model Context Protocol server for Tempo worklogs

Usage:
  npx tempo-mcp-server [options]

Options:
  --tempo-token, -t      Tempo API token
  --jira-token, -j       Jira API token
  --jira-email, -e       Jira account email
  --jira-base-url, -u    Jira instance base URL (e.g., https://your-org.atlassian.net)
  --help, -h             Show this help message

You can also provide these values using environment variables:
  TEMPO_API_TOKEN
  JIRA_API_TOKEN
  JIRA_EMAIL
  JIRA_BASE_URL

Example:
  npx tempo-mcp-server --tempo-token=your_tempo_token --jira-token=your_jira_token --jira-email=your@email.com --jira-base-url=https://your-org.atlassian.net
`);
  process.exit(0);
}

/**
 * Parse command line arguments and set corresponding environment variables
 * Format: --key=value or -k value
 */
export function parseArguments(args: string[]): void {
  // Help message
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
  }

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Handle --key=value format
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (value !== undefined) {
        setEnvFromArg(key, value);
      } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        // Handle --key value format
        setEnvFromArg(key, args[++i]);
      }
    } 
    // Handle -k value format
    else if (arg.startsWith('-') && i + 1 < args.length && !args[i + 1].startsWith('-')) {
      const key = arg.substring(1);
      setEnvFromArg(key, args[++i]);
    }
  }
}

/**
 * Set environment variable from command line argument
 */
function setEnvFromArg(key: string, value: string): void {
  switch (key) {
    case 'tempo-token':
    case 't':
      process.env.TEMPO_API_TOKEN = value;
      break;
    case 'jira-token':
    case 'j':
      process.env.JIRA_API_TOKEN = value;
      break;
    case 'jira-email':
    case 'e':
      process.env.JIRA_EMAIL = value;
      break;
    case 'jira-base-url':
    case 'u':
      process.env.JIRA_BASE_URL = value;
      break;
  }
} 