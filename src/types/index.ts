export {
  REQUIREMENT_TYPES,
  PRIORITY_LEVELS,
  LINK_TYPES,
  REVIEW_STATUSES,
  REVIEW_DISPOSITIONS,
  CHANGE_TYPES,
  CUSTOM_ATTRIBUTE_TYPES,
} from "./enums";

export type {
  RequirementType,
  PriorityLevel,
  LinkType,
  ReviewStatus,
  ReviewDisposition,
  ChangeType,
  CustomAttributeType,
} from "./enums";

import type {
  RequirementType,
  PriorityLevel,
  LinkType,
  ReviewStatus,
  ReviewDisposition,
  ChangeType,
  CustomAttributeType,
} from "./enums";

// ---------------------------------------------------------------------------
// Common type aliases
// ---------------------------------------------------------------------------

/** UUID v4 string */
export type UUID = string;

/** ISO 8601 timestamp string */
export type ISOTimestamp = string;

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export interface ProjectSettings {
  requirementIdPrefix: string;
  autoNumbering: boolean;
  defaultPriority: PriorityLevel;
  defaultType: RequirementType;
  enabledLinkTypes: LinkType[];
  customStatuses: string[];
}

export interface Project {
  id: UUID;
  name: string;
  description: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  createdBy: UUID;
  settings: ProjectSettings;
  modules: UUID[];
  tags: string[];
}

// ---------------------------------------------------------------------------
// Custom Attribute Definition
// ---------------------------------------------------------------------------

export interface CustomAttributeDefinition {
  id: UUID;
  projectId: UUID;
  name: string;
  description: string;
  type: CustomAttributeType;
  required: boolean;
  defaultValue?: string | number | boolean;
  enumValues?: string[];
  appliesTo: RequirementType[];
  createdAt: ISOTimestamp;
}

// ---------------------------------------------------------------------------
// Requirement
// ---------------------------------------------------------------------------

export interface Attachment {
  id: UUID;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  uploadedBy: UUID;
  uploadedAt: ISOTimestamp;
}

export interface Comment {
  id: UUID;
  authorId: UUID;
  body: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface Requirement {
  id: UUID;
  projectId: UUID;
  moduleId: UUID | null;
  requirementId: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: PriorityLevel;
  status: string;
  rationale: string;
  acceptanceCriteria: string[];
  tags: string[];
  customAttributes: Record<string, string | number | boolean>;
  attachments: Attachment[];
  comments: Comment[];
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  createdBy: UUID;
  updatedBy: UUID;
  version: number;
  deleted: boolean;
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------

export interface Module {
  id: UUID;
  projectId: UUID;
  name: string;
  description: string;
  parentModuleId: UUID | null;
  requirementIds: UUID[];
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

// ---------------------------------------------------------------------------
// Traceability Link
// ---------------------------------------------------------------------------

export interface TraceabilityLink {
  id: UUID;
  projectId: UUID;
  sourceId: UUID;
  targetId: UUID;
  linkType: LinkType;
  description: string;
  createdAt: ISOTimestamp;
  createdBy: UUID;
}

// ---------------------------------------------------------------------------
// Baseline & Snapshot
// ---------------------------------------------------------------------------

export interface RequirementSnapshot {
  requirementId: UUID;
  requirementIdHuman: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: PriorityLevel;
  status: string;
  version: number;
  customAttributes: Record<string, string | number | boolean>;
}

export interface Baseline {
  id: UUID;
  projectId: UUID;
  name: string;
  description: string;
  createdAt: ISOTimestamp;
  createdBy: UUID;
  snapshots: RequirementSnapshot[];
  tags: string[];
}

// ---------------------------------------------------------------------------
// Status Workflow
// ---------------------------------------------------------------------------

export interface WorkflowTransition {
  from: string;
  to: string;
  label: string;
  requiredFields?: string[];
}

export interface WorkflowStatus {
  name: string;
  description: string;
  isFinal: boolean;
  isInitial: boolean;
  color: string;
}

export interface StatusWorkflow {
  id: UUID;
  projectId: UUID;
  name: string;
  statuses: WorkflowStatus[];
  transitions: WorkflowTransition[];
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

export interface ReviewItem {
  requirementId: UUID;
  disposition: ReviewDisposition;
  comment: string;
  reviewedBy: UUID;
  reviewedAt: ISOTimestamp | null;
}

export interface Review {
  id: UUID;
  projectId: UUID;
  title: string;
  description: string;
  status: ReviewStatus;
  reviewers: UUID[];
  items: ReviewItem[];
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  createdBy: UUID;
  closedAt: ISOTimestamp | null;
}

// ---------------------------------------------------------------------------
// Change Record (Audit Log)
// ---------------------------------------------------------------------------

export interface ChangeRecord {
  id: UUID;
  projectId: UUID;
  requirementId: UUID;
  changeType: ChangeType;
  changedBy: UUID;
  changedAt: ISOTimestamp;
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  description: string;
}
