// Requirement Types
export const REQUIREMENT_TYPES = [
  "Stakeholder",
  "System",
  "Software",
  "Hardware",
  "Interface",
  "Test",
  "Constraint",
] as const;
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];

// Priority Levels
export const PRIORITY_LEVELS = [
  "Critical",
  "High",
  "Medium",
  "Low",
  "Undefined",
] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

// Traceability Link Types
export const LINK_TYPES = [
  "derives_from",
  "satisfies",
  "verified_by",
  "refines",
  "conflicts_with",
  "related_to",
  "implements",
] as const;
export type LinkType = (typeof LINK_TYPES)[number];

// Review Status
export const REVIEW_STATUSES = [
  "Open",
  "In Progress",
  "Closed",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

// Review Disposition
export const REVIEW_DISPOSITIONS = [
  "Accepted",
  "Rejected",
  "Needs Revision",
  "Deferred",
  "Pending",
] as const;
export type ReviewDisposition = (typeof REVIEW_DISPOSITIONS)[number];

// Change Record Types
export const CHANGE_TYPES = [
  "created",
  "updated",
  "status_changed",
  "link_added",
  "link_removed",
  "deleted",
  "restored",
] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];

// Custom Attribute Value Types
export const CUSTOM_ATTRIBUTE_TYPES = [
  "text",
  "number",
  "date",
  "enum",
  "boolean",
  "url",
] as const;
export type CustomAttributeType = (typeof CUSTOM_ATTRIBUTE_TYPES)[number];
