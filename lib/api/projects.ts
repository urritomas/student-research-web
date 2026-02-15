/**
 * Projects API service – replaces all direct Supabase project queries.
 */

import { get, post } from './client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  project_code: string;
  title: string;
  description?: string;
  abstract?: string;
  project_type: string;
  paper_standard: string;
  status: string;
  keywords: string[];
  document_reference?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  program?: string;
  course?: string;
  section?: string;
}

export interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  users: {
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

export interface CreateProjectPayload {
  title: string;
  abstract: string;
  keywords: string[];
  researchType: string;
  program?: string;
  course?: string;
  section?: string;
  file?: File | null;
}

export interface JoinProjectPayload {
  projectCode: string;
}

export interface JoinProjectResult {
  success: boolean;
  message?: string;
  project?: { id: string; title: string };
  error?: string;
}

// ─── API calls ──────────────────────────────────────────────────────────────

/** Fetch all projects the current user is a member of or created. */
export function getMyProjects() {
  return get<Project[]>('/projects');
}

/** Fetch a single project by ID. */
export function getProject(projectId: string) {
  return get<Project>(`/projects/${projectId}`);
}

/** Fetch members for a given project. */
export function getProjectMembers(projectId: string) {
  return get<ProjectMember[]>(`/projects/${projectId}/members`);
}

/** Create a new project (multipart – may include a file). */
export async function createProject(payload: CreateProjectPayload) {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('abstract', payload.abstract);
  formData.append('keywords', JSON.stringify(payload.keywords));
  formData.append('researchType', payload.researchType);
  if (payload.program) formData.append('program', payload.program);
  if (payload.course) formData.append('course', payload.course);
  if (payload.section) formData.append('section', payload.section);
  if (payload.file) formData.append('file', payload.file);

  return post<{ projectId: string; projectCode: string }>('/projects', formData);
}

/** Join a project using a project code. */
export async function joinProject(payload: JoinProjectPayload): Promise<JoinProjectResult> {
  const { data, error } = await post<JoinProjectResult>('/projects/join', payload);
  if (error) return { success: false, error };
  return data ?? { success: false, error: 'No response from server' };
}

/** Fetch projects the current user advises. */
export function getAdvisedProjects() {
  return get<Project[]>('/projects/advised');
}

/** Fetch project owner / creator profile. */
export function getProjectOwner(projectId: string) {
  return get<{ id: string; full_name: string; email: string; avatar_url?: string }>(
    `/projects/${projectId}/owner`,
  );
}
