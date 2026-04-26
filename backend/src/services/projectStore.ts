import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { Project, ProjectAsset, UGCNiche } from '../types';

const DATA_DIR = join(process.cwd(), 'data');
const PROJECTS_FILE = join(DATA_DIR, 'projects.json');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function load(): Project[] {
  ensureDataDir();
  if (!existsSync(PROJECTS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(PROJECTS_FILE, 'utf-8')) as Project[];
  } catch {
    return [];
  }
}

function save(projects: Project[]) {
  ensureDataDir();
  writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

export function listProjects(): Project[] {
  return load().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProject(id: string): Project | undefined {
  return load().find(p => p.id === id);
}

export function createProject(input: {
  name: string;
  client: string;
  niche?: UGCNiche;
  description?: string;
}): Project {
  const projects = load();
  const now = new Date().toISOString();
  const project: Project = {
    id: randomUUID(),
    name: input.name,
    client: input.client,
    niche: input.niche,
    description: input.description,
    assets: [],
    createdAt: now,
    updatedAt: now,
  };
  projects.push(project);
  save(projects);
  return project;
}

export function updateProject(
  id: string,
  patch: Partial<Pick<Project, 'name' | 'client' | 'niche' | 'description'>>
): Project | undefined {
  const projects = load();
  const idx = projects.findIndex(p => p.id === id);
  if (idx < 0) return undefined;
  projects[idx] = { ...projects[idx], ...patch, updatedAt: new Date().toISOString() };
  save(projects);
  return projects[idx];
}

export function deleteProject(id: string): boolean {
  const projects = load();
  const idx = projects.findIndex(p => p.id === id);
  if (idx < 0) return false;
  projects.splice(idx, 1);
  save(projects);
  return true;
}

export function addAssetToProject(
  projectId: string,
  asset: Omit<ProjectAsset, 'id' | 'createdAt'>
): Project | undefined {
  const projects = load();
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx < 0) return undefined;
  const newAsset: ProjectAsset = {
    id: randomUUID(),
    ...asset,
    createdAt: new Date().toISOString(),
  };
  projects[idx].assets.push(newAsset);
  projects[idx].updatedAt = new Date().toISOString();
  save(projects);
  return projects[idx];
}

export function removeAssetFromProject(projectId: string, assetId: string): Project | undefined {
  const projects = load();
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx < 0) return undefined;
  projects[idx].assets = projects[idx].assets.filter(a => a.id !== assetId);
  projects[idx].updatedAt = new Date().toISOString();
  save(projects);
  return projects[idx];
}
