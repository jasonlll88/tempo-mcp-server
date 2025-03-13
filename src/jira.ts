import axios from 'axios';
import { JiraUser, issueKeySchema, issueIdSchema } from './types.js';
import config from './config.js';

// Jira API client with authentication
const jiraApi = axios.create({
  baseURL: config.jiraApi.baseUrl,
  headers: {
    'Authorization': `Basic ${Buffer.from(`${config.jiraApi.email}:${config.jiraApi.token}`).toString('base64')}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Standardized error handling for Jira API
function formatJiraError(error: unknown, context: string): Error {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    const message = error.response?.data?.message || 
                    error.response?.data?.errorMessages?.join(', ') || 
                    error.message;
    return new Error(`${context}: ${statusCode} - ${message}`);
  }
  return new Error(`${context}: ${(error as Error).message}`);
}

/**
 * Get user's account ID using the configured email
 */
export async function getCurrentUserAccountId(): Promise<string> {
  try {
    const response = await jiraApi.get<JiraUser[]>('/rest/api/3/user/search', {
      params: { query: config.jiraApi.email }
    });

    const users = response.data;
    if (!users || users.length === 0) {
      throw new Error(`No user found with email: ${config.jiraApi.email}`);
    }

    // Find exact email match
    const user = users.find(u => u.emailAddress === config.jiraApi.email);
    if (!user) {
      throw new Error(`No exact match for email: ${config.jiraApi.email}`);
    }

    return user.accountId;
  } catch (error) {
    throw formatJiraError(error, 'Failed to get user account ID');
  }
}

/**
 * Get Jira issue ID from issue key
 */
export async function getIssueId(issueKey: string): Promise<string> {
  try {
    // Validate issue key using the schema
    const result = issueKeySchema().safeParse(issueKey);
    if (!result.success) {
      throw new Error(result.error.errors[0].message || 'Issue key validation failed');
    }
    
    const response = await jiraApi.get(`/rest/api/3/issue/${issueKey}`);
    return response.data.id;
  } catch (error) {
    throw formatJiraError(error, `Failed to get issue ID for ${issueKey}`);
  }
}

/**
 * Get Jira issue key from issue ID
 */
export async function getIssueKeyById(issueId: string | number): Promise<string> {
  try {
    // Validate issue ID using the schema
    const result = issueIdSchema().safeParse(issueId);
    if (!result.success) {
      throw new Error(result.error.errors[0].message || 'Issue ID validation failed');
    }
    
    const response = await jiraApi.get(`/rest/api/3/issue/${issueId}`);
    return response.data.key;
  } catch (error) {
    throw formatJiraError(error, `Failed to get issue key for ID ${issueId}`);
  }
} 