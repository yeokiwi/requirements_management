import { openDB, DBSchema, IDBPDatabase } from 'idb';
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
// Schema
// ---------------------------------------------------------------------------

export interface AppSetting {
  key: string;
  value: unknown;
}

interface RequirementsManagerDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { name: string };
  };
  requirements: {
    key: string;
    value: Requirement;
    indexes: {
      projectId: string;
      displayId: string;
      moduleId: string;
      status: string;
      priority: string;
      type: string;
      updatedAt: string;
    };
  };
  modules: {
    key: string;
    value: Module;
    indexes: {
      projectId: string;
      parentModuleId: string;
    };
  };
  traceabilityLinks: {
    key: string;
    value: TraceabilityLink;
    indexes: {
      projectId: string;
      sourceRequirementId: string;
      targetRequirementId: string;
      linkType: string;
    };
  };
  baselines: {
    key: string;
    value: Baseline;
    indexes: {
      projectId: string;
      createdAt: string;
    };
  };
  reviews: {
    key: string;
    value: Review;
    indexes: {
      projectId: string;
      status: string;
    };
  };
  changeHistory: {
    key: string;
    value: ChangeRecord;
    indexes: {
      projectId: string;
      requirementId: string;
      timestamp: string;
      author: string;
    };
  };
  appSettings: {
    key: string;
    value: AppSetting;
  };
}

// ---------------------------------------------------------------------------
// Store names
// ---------------------------------------------------------------------------

export type StoreName = keyof RequirementsManagerDB;

const STORE_NAMES: StoreName[] = [
  'projects',
  'requirements',
  'modules',
  'traceabilityLinks',
  'baselines',
  'reviews',
  'changeHistory',
  'appSettings',
];

// ---------------------------------------------------------------------------
// Singleton DB instance
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBPDatabase<RequirementsManagerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<RequirementsManagerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RequirementsManagerDB>('RequirementsManager', 1, {
      upgrade(db) {
        // projects
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('name', 'name');

        // requirements
        const reqStore = db.createObjectStore('requirements', { keyPath: 'id' });
        reqStore.createIndex('projectId', 'projectId');
        reqStore.createIndex('displayId', 'requirementId');
        reqStore.createIndex('moduleId', 'moduleId');
        reqStore.createIndex('status', 'status');
        reqStore.createIndex('priority', 'priority');
        reqStore.createIndex('type', 'type');
        reqStore.createIndex('updatedAt', 'updatedAt');

        // modules
        const modStore = db.createObjectStore('modules', { keyPath: 'id' });
        modStore.createIndex('projectId', 'projectId');
        modStore.createIndex('parentModuleId', 'parentModuleId');

        // traceabilityLinks
        const linkStore = db.createObjectStore('traceabilityLinks', { keyPath: 'id' });
        linkStore.createIndex('projectId', 'projectId');
        linkStore.createIndex('sourceRequirementId', 'sourceId');
        linkStore.createIndex('targetRequirementId', 'targetId');
        linkStore.createIndex('linkType', 'linkType');

        // baselines
        const baselineStore = db.createObjectStore('baselines', { keyPath: 'id' });
        baselineStore.createIndex('projectId', 'projectId');
        baselineStore.createIndex('createdAt', 'createdAt');

        // reviews
        const reviewStore = db.createObjectStore('reviews', { keyPath: 'id' });
        reviewStore.createIndex('projectId', 'projectId');
        reviewStore.createIndex('status', 'status');

        // changeHistory
        const changeStore = db.createObjectStore('changeHistory', { keyPath: 'id' });
        changeStore.createIndex('projectId', 'projectId');
        changeStore.createIndex('requirementId', 'requirementId');
        changeStore.createIndex('timestamp', 'changedAt');
        changeStore.createIndex('author', 'changedBy');

        // appSettings
        db.createObjectStore('appSettings', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Generic CRUD helpers
// ---------------------------------------------------------------------------

export async function getAll<S extends StoreName>(
  storeName: S,
  projectId?: string,
): Promise<RequirementsManagerDB[S]['value'][]> {
  const db = await getDB();
  if (projectId && storeName !== 'appSettings') {
    const store = db.transaction(storeName).store;
    const index = store.index('projectId' as any);
    return (await index.getAll(projectId)) as RequirementsManagerDB[S]['value'][];
  }
  return db.getAll(storeName);
}

export async function getById<S extends StoreName>(
  storeName: S,
  id: string,
): Promise<RequirementsManagerDB[S]['value'] | undefined> {
  const db = await getDB();
  return db.get(storeName, id);
}

export async function put<S extends StoreName>(
  storeName: S,
  item: RequirementsManagerDB[S]['value'],
): Promise<string> {
  const db = await getDB();
  return db.put(storeName, item) as Promise<string>;
}

export async function deleteRecord<S extends StoreName>(
  storeName: S,
  id: string,
): Promise<void> {
  const db = await getDB();
  await db.delete(storeName, id);
}

export async function getAllByIndex<S extends StoreName>(
  storeName: S,
  indexName: string,
  value: string,
): Promise<RequirementsManagerDB[S]['value'][]> {
  const db = await getDB();
  const tx = db.transaction(storeName);
  const index = tx.store.index(indexName as any);
  return (await index.getAll(value)) as RequirementsManagerDB[S]['value'][];
}

// ---------------------------------------------------------------------------
// Clear all data
// ---------------------------------------------------------------------------

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAMES, 'readwrite');
  await Promise.all(STORE_NAMES.map((name) => tx.objectStore(name).clear()));
  await tx.done;
}
