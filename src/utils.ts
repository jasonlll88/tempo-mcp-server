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