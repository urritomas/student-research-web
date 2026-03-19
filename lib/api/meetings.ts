/**
 * Meetings API service.
 */

import { get } from './client';

export interface Meeting {
  id: string;
  adviser_id: string;
  student_id?: string;
  project_id?: string;
  project_title?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  created_at: string;
}

/** Fetch all meetings for a specific adviser. */
export function getAdviserMeetings(adviserId: string) {
  return get<Meeting[]>(`/meetings/adviser/${adviserId}`);
}
