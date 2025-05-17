import axios from 'axios';
import {
  ToolResponse,
  TempoWorklog,
  WorklogResult,
  WorklogError,
  WorklogEntry
} from './types.js';
import config from './config.js';
import { getCurrentUserAccountId, getIssueId } from './jira.js';
import { formatError, getIssueKeysMap, calculateEndTime } from './utils.js';

// API client for Tempo
const api = axios.create({
  baseURL: config.tempoApi.baseUrl,
  headers: {
    'Authorization': `Bearer ${config.tempoApi.token}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Retrieve worklogs for the configured user within a date range
 */
export async function retrieveWorklogs(
  startDate: string, 
  endDate: string
): Promise<ToolResponse> {
  try {
    const accountId = await getCurrentUserAccountId();
    
    const response = await api.get(`/worklogs/user/${accountId}`, {
      params: { from: startDate, to: endDate }
    });
    
    const worklogs = response.data.results || [];
    
    // If no worklogs found, return empty content
    if (worklogs.length === 0) {
      return {
        content: [{ type: "text", text: "No worklogs found for the specified date range." }],
      };
    }
    
    // Get issue keys for all worklogs
    const issueIdToKeyMap = await getIssueKeysMap(worklogs);
    
    // Format the response
    const formattedContent = worklogs.map((worklog: any) => {
      const issueId = worklog.issue?.id || 'Unknown';
      const issueKey = issueIdToKeyMap[issueId] || 'Unknown';
      const description = worklog.description || 'No description';
      const timeSpentHours = (worklog.timeSpentSeconds / 3600).toFixed(2);
      const date = worklog.startDate || 'Unknown';
      
      return {
        type: "text",
        text: `IssueKey: ${issueKey} | IssueId: ${issueId} | Date: ${date} | Hours: ${timeSpentHours} | Description: ${description}`
      };
    });
    
    return {
      content: formattedContent,
      metadata: {
        totalCount: worklogs.length,
        startDate,
        endDate
      }
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error retrieving worklogs: ${formatError(error)}` }]
    };
  }
}

/**
 * Create a new worklog
 */
export async function createWorklog(
  issueKey: string, 
  timeSpentHours: number, 
  date: string, 
  description: string = '',
  startTime: string | undefined = undefined
): Promise<ToolResponse> {
  try {
    // Get issue ID and account ID
    const issueId = await getIssueId(issueKey);
    const accountId = await getCurrentUserAccountId();
    
    // Prepare payload
    const payload = {
      issueId,
      timeSpentSeconds: Math.round(timeSpentHours * 3600),
      startDate: date,
      authorAccountId: accountId,
      description,
      ...(startTime && { startTime }),
    };
    
    // Submit the worklog
    const response = await api.post('/worklogs', payload);
    
    // Calculate end time if start time is provided
    let timeInfo = '';
    if (startTime) {
      const endTime = calculateEndTime(startTime, timeSpentHours);
      timeInfo = ` starting at ${startTime} and ending at ${endTime}`;
    }
    
    return {
      content: [{
        type: "text",
        text: `Worklog with ID ${response.data.tempoWorklogId} created successfully for ${issueKey}. Time logged: ${timeSpentHours} hours on ${date}${timeInfo}`
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: `Failed to create worklog: ${formatError(error)}` }]
    };
  }
}

/**
 * Create multiple worklogs
 */
export async function bulkCreateWorklogs(
  worklogEntries: WorklogEntry[]
): Promise<ToolResponse> {
  try {
    // Get user account ID
    const authorAccountId = await getCurrentUserAccountId();
    
    // Group entries by issue key
    const entriesByIssueKey: Record<string, WorklogEntry[]> = {};
    worklogEntries.forEach(entry => {
      if (!entriesByIssueKey[entry.issueKey]) {
        entriesByIssueKey[entry.issueKey] = [];
      }
      entriesByIssueKey[entry.issueKey].push(entry);
    });
    
    const results: WorklogResult[] = [];
    const errors: WorklogError[] = [];
    
    // Process each issue's entries 
    for (const [issueKey, entries] of Object.entries(entriesByIssueKey)) {
      try {
        const issueId = await getIssueId(issueKey);
        
        // Format entries for API
        const formattedEntries = entries.map(entry => ({
          timeSpentSeconds: Math.round(entry.timeSpentHours * 3600),
          startDate: entry.date,
          authorAccountId,
          description: entry.description || '',
          ...(entry.startTime && { startTime: entry.startTime }),
        }));
        
        // Submit bulk request
        const response = await api.post(`/worklogs/issue/${issueId}/bulk`, formattedEntries);
        const createdWorklogs = response.data || [];
        
        // Record results
        entries.forEach((entry, i) => {
          const created = createdWorklogs[i] || null;
          
          // Calculate end time if startTime is provided
          let endTime = undefined;
          if (entry.startTime && created) {
            endTime = calculateEndTime(entry.startTime, entry.timeSpentHours);
          }
          
          results.push({
            issueKey,
            timeSpentHours: entry.timeSpentHours,
            date: entry.date,
            worklogId: created?.tempoWorklogId || null,
            success: !!created,
            startTime: entry.startTime,
            endTime
          });
        });
      } catch (error) {
        const errorMessage = formatError(error);
        
        // Record errors
        entries.forEach(entry => {
          errors.push({
            issueKey,
            timeSpentHours: entry.timeSpentHours,
            date: entry.date,
            error: errorMessage
          });
        });
      }
    }
    
    // Create content for response
    const content: Array<{ type: "text"; text: string }> = [];
    const successCount = results.filter(r => r.success).length;
    
    // Add success messages
    if (successCount > 0) {
      content.push({ type: "text", text: `Successfully created ${successCount} worklogs:` });
      
      results.filter(r => r.success).forEach(result => {
        let timeInfo = '';
        if (result.startTime) {
          timeInfo = ` starting at ${result.startTime}${result.endTime ? ` and ending at ${result.endTime}` : ''}`;
        }
        
        content.push({
          type: "text",
          text: `- Issue ${result.issueKey}: ${result.timeSpentHours} hours on ${result.date}${timeInfo}`
        });
      });
    }
    
    // Add error messages
    if (errors.length > 0) {
      content.push({ type: "text", text: `Failed to create ${errors.length} worklogs:` });
      
      errors.forEach(error => {
        content.push({
          type: "text",
          text: `- Issue ${error.issueKey}: ${error.timeSpentHours} hours on ${error.date}. Error: ${error.error}`
        });
      });
    }
    
    return {
      content,
      metadata: {
        totalSuccess: successCount,
        totalFailure: errors.length,
        details: { successes: results.filter(r => r.success), failures: errors }
      },
      isError: errors.length > 0 && successCount === 0
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error processing bulk worklogs: ${formatError(error)}` }]
    };
  }
}

/**
 * Edit an existing worklog
 */
export async function editWorklog(
  worklogId: string, 
  timeSpentHours: number, 
  description: string | null = null, 
  date: string | null = null,
  startTime: string | undefined = undefined
): Promise<ToolResponse> {
  try {
    // Get current worklog
    const response = await api.get<TempoWorklog>(`/worklogs/${worklogId}`);
    const worklog = response.data;
    
    // Prepare update payload
    const updatePayload = {
      authorAccountId: worklog.author.accountId,
      startDate: date || worklog.startDate,
      timeSpentSeconds: Math.round(timeSpentHours * 3600),
      billableSeconds: Math.round(timeSpentHours * 3600),
      ...(description !== null && { description }),
      ...(startTime && { startTime }),
    };

    // Update the worklog
    await api.put(`/worklogs/${worklogId}`, updatePayload);
    
    // Information about the update
    let updateInfo = `Worklog updated successfully`;
    
    // Calculate and show time info if we have a start time
    if (startTime) {
      const endTime = calculateEndTime(startTime, timeSpentHours);
      updateInfo += `. Time logged: ${timeSpentHours} hours starting at ${startTime} and ending at ${endTime}`;
    }
    
    // Format response
    return {
      content: [{
        type: "text",
        text: updateInfo
      }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: `Failed to edit worklog: ${formatError(error)}` }]
    };
  }
}

/**
 * Delete a worklog
 */
export async function deleteWorklog(
  worklogId: string
): Promise<ToolResponse> {
  try {
    // Get worklog details for the response
    let worklogDetails = null;
    try {
      const response = await api.get<TempoWorklog>(`/worklogs/${worklogId}`);
      worklogDetails = response.data;
    } catch (error) {
      // Continue with deletion even if we can't get details
      console.error(`Could not fetch worklog details: ${(error as Error).message}`);
    }
    
    // Delete the worklog
    await api.delete(`/worklogs/${worklogId}`);
    
    return {
      content: [{ type: "text", text: "Worklog deleted successfully" }],
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: `Failed to delete worklog: ${formatError(error)}` }]
    };
  }
} 