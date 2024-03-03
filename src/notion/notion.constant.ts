import { JobStatus } from 'bull';

export const NOTION = 'notion';
export const NOTION_JOB = 'notion-job';

export const MAP_JOB_STATUS: Partial<Record<JobStatus | 'default', string>> = {
  completed: 'completed',
  failed: 'failed',
  default: 'on_progress',
};
