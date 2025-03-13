/**
 * Configuration manager for the MCP server
 * Validates required environment variables and exports config settings
 */
import { envSchema } from './types.js';
import { ZodError } from 'zod';

// Check if help flag is provided
const isHelpRequested = process.argv.includes('--help') || process.argv.includes('-h');

// Validate environment variables
function validateEnv() {
  // Skip validation if help flag is provided
  if (isHelpRequested) {
    return {
      TEMPO_API_TOKEN: 'dummy-for-help-flag',
      JIRA_BASE_URL: 'dummy-for-help-flag',
      JIRA_API_TOKEN: 'dummy-for-help-flag',
      JIRA_EMAIL: 'dummy-for-help-flag'
    };
  }

  try {
    // Parse and validate environment variables
    return envSchema.parse(process.env);
  } catch (error: unknown) {
    // Format and display validation errors
    console.error('[ERROR] Environment validation failed:');
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(error instanceof Error ? error.message : String(error));
    }
    process.exit(1);
  }
}

// Get validated environment variables
const env = validateEnv();

// Application configuration with validated environment variables
const config = {
  tempoApi: {
    baseUrl: 'https://api.tempo.io/4',
    token: env.TEMPO_API_TOKEN,
  },
  
  jiraApi: {
    baseUrl: env.JIRA_BASE_URL,
    token: env.JIRA_API_TOKEN,
    email: env.JIRA_EMAIL,
  },
  
  server: {
    name: 'tempo-mcp-server',
    version: '1.0.0',
  }
};

export default config; 