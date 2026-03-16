import {
  getDB,
  getAll,
  put,
  clearAllData,
  type StoreName,
} from './database';

import type {
  Project,
  Requirement,
  Module,
  TraceabilityLink,
  Baseline,
  Review,
  ChangeRecord,
} from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FullBackup {
  version: 1;
  exportedAt: string;
  projects: Project[];
  requirements: Requirement[];
  modules: Module[];
  traceabilityLinks: TraceabilityLink[];
  baselines: Baseline[];
  reviews: Review[];
  changeHistory: ChangeRecord[];
  appSettings: { key: string; value: unknown }[];
}

export interface ProjectBackup {
  version: 1;
  exportedAt: string;
  project: Project;
  requirements: Requirement[];
  modules: Module[];
  traceabilityLinks: TraceabilityLink[];
  baselines: Baseline[];
  reviews: Review[];
  changeHistory: ChangeRecord[];
}

type ImportMode = 'skip' | 'overwrite' | 'new';

// ---------------------------------------------------------------------------
// Full backup
// ---------------------------------------------------------------------------

export async function exportFullBackup(): Promise<FullBackup> {
  const db = await getDB();

  const [
    projects,
    requirements,
    modules,
    traceabilityLinks,
    baselines,
    reviews,
    changeHistory,
    appSettings,
  ] = await Promise.all([
    db.getAll('projects'),
    db.getAll('requirements'),
    db.getAll('modules'),
    db.getAll('traceabilityLinks'),
    db.getAll('baselines'),
    db.getAll('reviews'),
    db.getAll('changeHistory'),
    db.getAll('appSettings'),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects,
    requirements,
    modules,
    traceabilityLinks,
    baselines,
    reviews,
    changeHistory,
    appSettings,
  };
}

export async function importFullBackup(data: FullBackup): Promise<void> {
  if (!data || data.version !== 1) {
    throw new Error('Invalid backup format or unsupported version.');
  }

  await clearAllData();

  const db = await getDB();
  const storeNames: StoreName[] = [
    'projects',
    'requirements',
    'modules',
    'traceabilityLinks',
    'baselines',
    'reviews',
    'changeHistory',
    'appSettings',
  ];

  const tx = db.transaction(storeNames, 'readwrite');

  const putAll = (storeName: StoreName, items: any[]) =>
    items.map((item) => tx.objectStore(storeName).put(item));

  putAll('projects', data.projects ?? []);
  putAll('requirements', data.requirements ?? []);
  putAll('modules', data.modules ?? []);
  putAll('traceabilityLinks', data.traceabilityLinks ?? []);
  putAll('baselines', data.baselines ?? []);
  putAll('reviews', data.reviews ?? []);
  putAll('changeHistory', data.changeHistory ?? []);
  putAll('appSettings', data.appSettings ?? []);

  await tx.done;
}

// ---------------------------------------------------------------------------
// Project backup
// ---------------------------------------------------------------------------

export async function exportProjectBackup(projectId: string): Promise<ProjectBackup> {
  const db = await getDB();

  const project = await db.get('projects', projectId);
  if (!project) {
    throw new Error(`Project ${projectId} not found.`);
  }

  const byProject = async <S extends StoreName>(store: S) => {
    const tx = db.transaction(store);
    const index = tx.store.index('projectId' as any);
    return index.getAll(projectId);
  };

  const [requirements, modules, traceabilityLinks, baselines, reviews, changeHistory] =
    await Promise.all([
      byProject('requirements'),
      byProject('modules'),
      byProject('traceabilityLinks'),
      byProject('baselines'),
      byProject('reviews'),
      byProject('changeHistory'),
    ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    project,
    requirements: requirements as Requirement[],
    modules: modules as Module[],
    traceabilityLinks: traceabilityLinks as TraceabilityLink[],
    baselines: baselines as Baseline[],
    reviews: reviews as Review[],
    changeHistory: changeHistory as ChangeRecord[],
  };
}

export async function importProjectBackup(
  data: ProjectBackup,
  mode: ImportMode,
): Promise<void> {
  if (!data || data.version !== 1 || !data.project) {
    throw new Error('Invalid project backup format or unsupported version.');
  }

  const db = await getDB();

  const existingProject = await db.get('projects', data.project.id);

  if (existingProject && mode === 'skip') {
    return;
  }

  // In 'new' mode, generate a new project id and remap all references
  let projectData = data;
  if (existingProject && mode === 'new') {
    const newProjectId = crypto.randomUUID();
    const idMap = new Map<string, string>();
    idMap.set(data.project.id, newProjectId);

    // Generate new ids for all entities
    const remapId = (oldId: string): string => {
      if (!idMap.has(oldId)) {
        idMap.set(oldId, crypto.randomUUID());
      }
      return idMap.get(oldId)!;
    };

    projectData = {
      ...data,
      project: { ...data.project, id: newProjectId },
      requirements: data.requirements.map((r) => ({
        ...r,
        id: remapId(r.id),
        projectId: newProjectId,
        moduleId: r.moduleId ? remapId(r.moduleId) : null,
      })),
      modules: data.modules.map((m) => ({
        ...m,
        id: remapId(m.id),
        projectId: newProjectId,
        parentModuleId: m.parentModuleId ? remapId(m.parentModuleId) : null,
        requirementIds: m.requirementIds.map((rid) => remapId(rid)),
      })),
      traceabilityLinks: data.traceabilityLinks.map((l) => ({
        ...l,
        id: remapId(l.id),
        projectId: newProjectId,
        sourceId: remapId(l.sourceId),
        targetId: remapId(l.targetId),
      })),
      baselines: data.baselines.map((b) => ({
        ...b,
        id: remapId(b.id),
        projectId: newProjectId,
      })),
      reviews: data.reviews.map((r) => ({
        ...r,
        id: remapId(r.id),
        projectId: newProjectId,
      })),
      changeHistory: data.changeHistory.map((c) => ({
        ...c,
        id: remapId(c.id),
        projectId: newProjectId,
        requirementId: remapId(c.requirementId),
      })),
    };
  }

  // Write everything in a single transaction
  const storeNames: StoreName[] = [
    'projects',
    'requirements',
    'modules',
    'traceabilityLinks',
    'baselines',
    'reviews',
    'changeHistory',
  ];

  const tx = db.transaction(storeNames, 'readwrite');
  tx.objectStore('projects').put(projectData.project);
  projectData.requirements.forEach((r) => tx.objectStore('requirements').put(r));
  projectData.modules.forEach((m) => tx.objectStore('modules').put(m));
  projectData.traceabilityLinks.forEach((l) => tx.objectStore('traceabilityLinks').put(l));
  projectData.baselines.forEach((b) => tx.objectStore('baselines').put(b));
  projectData.reviews.forEach((r) => tx.objectStore('reviews').put(r));
  projectData.changeHistory.forEach((c) => tx.objectStore('changeHistory').put(c));
  await tx.done;
}
