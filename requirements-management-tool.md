# Coding Prompt: Standalone Browser-Based Requirements Management Tool

## 1. Project Overview

Build a **standalone, self-contained requirements management web application** that runs entirely in the browser. The application must function as a single HTML file (or a minimal set of static files served via a simple HTTP server) with **no backend server, no database, and no external API calls**. All data persistence is handled via browser `IndexedDB` with JSON import/export for portability.

The tool is intended as a lightweight, offline-capable alternative to enterprise requirements management platforms (e.g., IBM DOORS, Jama Connect, Requirements Yogi). It must support the full lifecycle of requirements authoring, traceability, baselining, review, and reporting.

**Technology Stack:**
- **Frontend Framework:** React 18+ (via CDN or bundled)
- **State Management:** Zustand (lightweight, minimal boilerplate)
- **UI Components:** Tailwind CSS + shadcn/ui component patterns (inline)
- **Persistence:** IndexedDB via `idb` wrapper library
- **Rich Text:** TipTap editor (ProseMirror-based, extensible)
- **Charts/Graphs:** D3.js for traceability visualization
- **Export:** jsPDF + html2canvas for PDF reports; SheetJS for Excel export
- **Build:** Vite (for development), single-file production build

---

## 2. Core Data Model

### 2.1 Project

```
Project {
  id: string (UUID v4)
  name: string
  prefix: string (e.g., "SYS", "SW", "HW" — used in requirement IDs)
  description: string (rich text)
  createdAt: ISO 8601 timestamp
  updatedAt: ISO 8601 timestamp
  metadata: Record<string, string> (arbitrary key-value pairs)
  settings: ProjectSettings
}

ProjectSettings {
  requirementIdFormat: string (e.g., "{prefix}-{seq:4}" → "SYS-0001")
  defaultPriority: PriorityLevel
  customAttributes: CustomAttributeDefinition[]
  statusWorkflow: StatusWorkflow
  categoryTaxonomy: string[] (e.g., ["Functional", "Non-Functional", "Interface", "Constraint"])
}
```

### 2.2 Requirement

```
Requirement {
  id: string (UUID v4)
  displayId: string (auto-generated, e.g., "SYS-0042")
  projectId: string (FK → Project)
  moduleId: string | null (FK → Module, for grouping)
  title: string (max 200 chars)
  description: string (rich text — supports bold, italic, lists, tables, images, code blocks)
  rationale: string (rich text — why this requirement exists)
  acceptanceCriteria: string (rich text)
  type: RequirementType
  priority: PriorityLevel
  status: StatusValue
  category: string (from project taxonomy)
  owner: string (free-text assignee name)
  source: string (where the requirement originated — e.g., "Customer Interview #3", "RFP Section 4.2")
  version: integer (auto-incremented on edit)
  createdAt: ISO 8601 timestamp
  updatedAt: ISO 8601 timestamp
  customAttributes: Record<string, any> (values for project-defined custom attributes)
  tags: string[]
  attachments: Attachment[]
  comments: Comment[]
}

RequirementType = "Stakeholder" | "System" | "Software" | "Hardware" | "Interface" | "Test" | "Constraint"

PriorityLevel = "Critical" | "High" | "Medium" | "Low" | "Undefined"

StatusValue = string (defined per project via StatusWorkflow)

Attachment {
  id: string
  filename: string
  mimeType: string
  data: string (base64-encoded, stored in IndexedDB)
  addedAt: ISO 8601 timestamp
}

Comment {
  id: string
  author: string
  content: string
  createdAt: ISO 8601 timestamp
  resolved: boolean
}
```

### 2.3 Custom Attribute Definition

```
CustomAttributeDefinition {
  id: string
  name: string (e.g., "Verification Method", "Safety Level", "ASIL Rating")
  type: "text" | "number" | "date" | "enum" | "boolean" | "url"
  enumValues?: string[] (for type=enum)
  required: boolean
  defaultValue?: any
}
```

### 2.4 Module (Logical Grouping)

```
Module {
  id: string
  projectId: string
  name: string (e.g., "Sensor Subsystem", "Communication Interface")
  description: string
  parentModuleId: string | null (for hierarchical nesting)
  sortOrder: number
}
```

### 2.5 Traceability Link

```
TraceabilityLink {
  id: string
  projectId: string
  sourceRequirementId: string
  targetRequirementId: string
  linkType: LinkType
  description: string (optional rationale for the link)
  createdAt: ISO 8601 timestamp
}

LinkType = "derives_from" | "satisfies" | "verified_by" | "refines" | "conflicts_with" | "related_to" | "implements"
```

### 2.6 Baseline (Snapshot)

```
Baseline {
  id: string
  projectId: string
  name: string (e.g., "CDR Baseline v1.0")
  description: string
  createdAt: ISO 8601 timestamp
  snapshot: RequirementSnapshot[] (deep copy of all requirements at baseline time)
}

RequirementSnapshot {
  requirementId: string
  displayId: string
  title: string
  description: string
  status: string
  priority: string
  version: integer
  allFields: Record<string, any> (complete serialized state)
}
```

### 2.7 Status Workflow

```
StatusWorkflow {
  statuses: WorkflowStatus[]
  transitions: WorkflowTransition[]
}

WorkflowStatus {
  value: string (e.g., "Draft", "In Review", "Approved", "Implemented", "Verified", "Rejected", "Deferred")
  color: string (hex color for UI badges)
  isFinal: boolean
  isInitial: boolean
}

WorkflowTransition {
  from: string
  to: string
  label: string (e.g., "Submit for Review", "Approve", "Reject")
}
```

### 2.8 Review

```
Review {
  id: string
  projectId: string
  name: string (e.g., "PDR Requirements Review")
  description: string
  status: "Open" | "In Progress" | "Closed"
  createdAt: ISO 8601 timestamp
  closedAt: ISO 8601 timestamp | null
  reviewItems: ReviewItem[]
}

ReviewItem {
  requirementId: string
  reviewerName: string
  disposition: "Accepted" | "Rejected" | "Needs Revision" | "Deferred" | "Pending"
  comment: string
  reviewedAt: ISO 8601 timestamp | null
}
```

### 2.9 Change History (Audit Trail)

```
ChangeRecord {
  id: string
  requirementId: string
  projectId: string
  timestamp: ISO 8601 timestamp
  changeType: "created" | "updated" | "status_changed" | "link_added" | "link_removed" | "deleted" | "restored"
  author: string
  previousValues: Record<string, any> (fields before change)
  newValues: Record<string, any> (fields after change)
  changeDescription: string (auto-generated summary)
}
```

---

## 3. Application Architecture

### 3.1 Page/View Structure

The application uses a **single-page architecture** with a persistent sidebar navigation and a main content area.

```
┌─────────────────────────────────────────────────────────┐
│  Top Bar: [Project Selector ▼]  [Search 🔍]  [⚙ Settings]  [User: ___]  │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  Sidebar   │          Main Content Area                 │
│            │                                            │
│  Dashboard │  (varies by selected view)                 │
│  Modules   │                                            │
│  All Reqs  │                                            │
│  Traceabil.│                                            │
│  Reviews   │                                            │
│  Baselines │                                            │
│  Reports   │                                            │
│  Import/Exp│                                            │
│  Settings  │                                            │
│            │                                            │
└────────────┴────────────────────────────────────────────┘
```

### 3.2 View Descriptions

#### 3.2.1 Dashboard

- **Project summary cards:** Total requirements count, breakdown by status (stacked bar chart), breakdown by priority (donut chart), breakdown by type.
- **Recent activity feed:** Last 20 change records, showing who changed what and when.
- **Coverage metrics:** Percentage of requirements with at least one traceability link, percentage with acceptance criteria defined, percentage in a final status.
- **Stale requirements alert:** Requirements not updated in >30 days that are still in non-final status.
- **Review status summary:** Open reviews with pending item counts.

#### 3.2.2 Module Tree View

- Left panel: Hierarchical tree of modules (drag-and-drop reordering supported).
- Right panel: Requirements belonging to the selected module, displayed in a sortable/filterable table.
- Inline "New Requirement" button at the bottom of the table.
- Drag requirements between modules via drag-and-drop.
- Context menu on module nodes: Rename, Delete (with reassignment prompt), Add Sub-Module, Export Module.

#### 3.2.3 Requirements Table View (All Requirements)

A full-featured data grid with:

- **Columns (default visible):** Display ID, Title, Type, Status (color badge), Priority, Category, Owner, Module, Updated Date.
- **Column customization:** Show/hide any field including custom attributes. Drag to reorder columns. Resize column widths.
- **Sorting:** Click column header to sort ascending/descending. Multi-column sort via Shift+Click.
- **Filtering:** Per-column filter dropdowns for enum fields; text search for string fields; date range for date fields. A global filter bar at the top for combined filter expressions.
- **Inline editing:** Double-click a cell to edit in-place for simple fields (title, priority, status, owner, tags). Full editor opens for rich text fields.
- **Bulk operations toolbar** (appears when rows are selected via checkbox):
  - Change Status (batch)
  - Change Priority (batch)
  - Change Owner (batch)
  - Assign to Module (batch)
  - Delete (batch, with confirmation)
  - Add Tag (batch)
  - Export Selected
- **Pagination:** Virtual scrolling for performance with 1000+ requirements. Page size selector: 25, 50, 100, All.
- **Row click** → opens the Requirement Detail Panel (slide-in from right, or full page).

#### 3.2.4 Requirement Detail View

When a requirement is selected, display a full detail panel:

- **Header:** Display ID + Title (editable inline). Status badge with transition dropdown. Priority badge.
- **Tabbed content area:**
  - **Details Tab:** Rich text editor for Description, Rationale, Acceptance Criteria. All standard and custom attribute fields in a form layout.
  - **Traceability Tab:** Lists of upstream links (this requirement derives from / is satisfied by) and downstream links (requirements that derive from / are satisfied by this one). "Add Link" button with a searchable requirement picker dialog. Visual mini-graph showing immediate neighbors.
  - **History Tab:** Full change history for this requirement (audit trail). Each entry shows timestamp, author, field-by-field diff (old value → new value). Option to revert to a previous version.
  - **Comments Tab:** Threaded comment list. Add new comment form. Mark comments as resolved.
  - **Attachments Tab:** Upload files (stored as base64 in IndexedDB). Preview images inline. Download button for each attachment.
- **Sidebar within detail view:** Quick-access metadata: Created date, Last updated, Version number, Owner, Tags (editable chip input).

#### 3.2.5 Traceability Matrix View

- **Interactive matrix (spreadsheet-like):** Rows = source requirements (e.g., Stakeholder level), Columns = target requirements (e.g., System level). Cells show link type indicator (colored dot/icon).
- **Filter controls:** Select source module/type for rows, target module/type for columns, filter by link type.
- **Click a cell** → create or remove a link. Hover a cell → tooltip showing link details.
- **Coverage indicator:** Row/column headers highlighted red if no links exist (gap analysis).
- **Export matrix** as CSV or PDF.

#### 3.2.6 Traceability Graph View

- **D3.js force-directed graph** (or hierarchical layout toggle):
  - Nodes = requirements (colored by type or status).
  - Edges = traceability links (colored/styled by link type, with arrowheads for direction).
  - Node size proportional to number of links.
- **Controls:**
  - Layout toggle: Force-directed / Hierarchical (top-down) / Radial.
  - Filter by type, module, status, link type.
  - Depth slider: Show N levels from selected node.
  - Search: Highlight and zoom to a specific requirement.
- **Interactions:**
  - Click node → show detail tooltip or open detail panel.
  - Drag nodes to rearrange.
  - Zoom and pan.
  - Right-click node → context menu (Open Detail, Add Link, Remove Links).
- **Impact analysis mode:** Select a requirement → highlight all transitively connected requirements (upstream and downstream) to visualize change impact.

#### 3.2.7 Reviews View

- **Review list:** Table of all reviews with name, status, created date, item count, completion percentage.
- **Create Review dialog:** Name, description, select requirements to include (via filter/search or select from table).
- **Review workspace:** For each review item:
  - Display requirement details (read-only snapshot at review creation time).
  - Disposition selector: Accepted / Rejected / Needs Revision / Deferred.
  - Comment field for reviewer feedback.
  - Side-by-side diff if requirement was modified since review creation.
- **Review summary:** Tally of dispositions, option to close review and apply bulk status transitions based on dispositions.

#### 3.2.8 Baselines View

- **Baseline list:** Name, description, date created, requirement count.
- **Create Baseline button:** Snapshots all current requirements.
- **Baseline detail:** View the frozen state of requirements at that point in time.
- **Compare Baselines:** Select two baselines → generate a diff report showing added, removed, and modified requirements with field-level diffs.
- **Export baseline** as PDF or JSON.

#### 3.2.9 Reports View

Generate on-demand reports:

| Report | Description |
|--------|-------------|
| **Requirements Specification Document** | Formatted document (PDF) with all requirements grouped by module, including descriptions, rationale, and metadata. Table of contents. Cover page with project name and generation date. |
| **Traceability Report** | Full traceability matrix as a formatted table (PDF or Excel). Highlights gaps (requirements with no upstream or downstream links). |
| **Status Summary Report** | Breakdown of requirements by status, priority, and type. Charts and tables. |
| **Change Log Report** | Chronological list of all changes in a date range, filterable by requirement, author, or change type. |
| **Gap Analysis Report** | Requirements lacking: traceability links, acceptance criteria, owner assignment, or stuck in Draft status beyond a configurable threshold. |
| **Baseline Comparison Report** | Diff between two selected baselines. |
| **Review Summary Report** | Per-review summary of dispositions and comments. |

All reports support:
- Date range filtering.
- Module/type/status filtering.
- PDF and Excel export.
- Print-optimized CSS for direct browser printing.

#### 3.2.10 Import/Export View

**Import:**
- **JSON:** Full project import (complete data model). Merge mode: skip duplicates, overwrite, or create new with prefix.
- **CSV:** Map columns to requirement fields via a column mapping dialog. Preview first 10 rows before committing.
- **ReqIF (XML):** Parse ReqIF (Requirements Interchange Format — ISO/IEC/IEEE 29148 standard) files. Map ReqIF spec objects to Requirement fields. Handle ReqIF relations as traceability links.
- **Excel (.xlsx):** Similar to CSV but with sheet selection.

**Export:**
- **JSON:** Full project export (all data, importable back).
- **CSV:** Configurable columns, with or without rich text (stripped to plain text).
- **ReqIF:** Generate standards-compliant ReqIF XML for interchange with DOORS, Jama, etc.
- **Excel (.xlsx):** Formatted spreadsheet with separate sheets for Requirements, Traceability Links, Modules.
- **PDF:** Formatted requirements specification document (see Reports).
- **HTML:** Standalone HTML report (self-contained, viewable offline).

#### 3.2.11 Settings View

- **Project Settings:** Edit project name, prefix, description, metadata.
- **Status Workflow Editor:** Visual workflow designer — drag-and-drop status nodes, draw transition arrows between them. Set initial/final states. Assign colors.
- **Custom Attributes Manager:** Add/edit/remove custom attribute definitions. Reorder display order. Set required/optional.
- **Category Taxonomy Editor:** Add/edit/remove categories.
- **User Identity:** Set the current user name (stored locally). This name is used as the author in change records and comments. No authentication — honor system.
- **Display Preferences:** Dark mode toggle. Default page size. Date format (ISO / US / EU). Compact/comfortable table density. Sidebar collapsed by default toggle.
- **Data Management:** Export all projects as a single JSON backup. Import backup. Clear all data (with triple confirmation).

---

## 4. Functional Requirements

### 4.1 Requirement ID Generation

- Auto-generate display IDs based on the project's `requirementIdFormat` setting.
- Default format: `{prefix}-{seq:4}` where `{seq:4}` is a zero-padded 4-digit sequence number.
- Sequence is per-project and monotonically increasing (never reuse deleted IDs).
- Display IDs are immutable once created.

### 4.2 Rich Text Editor

- Use TipTap (ProseMirror-based) for all rich text fields.
- Supported formatting: Bold, Italic, Underline, Strikethrough, Headings (H1-H3), Bullet lists, Numbered lists, Tables (insert, resize, merge cells), Code blocks (with syntax highlighting), Blockquotes, Horizontal rules, Links, Images (paste from clipboard or upload — stored as base64).
- Toolbar: Formatting bar above editor with toggle buttons.
- Keyboard shortcuts: Ctrl+B, Ctrl+I, Ctrl+U, etc.
- Mention/reference: Type `@REQ-` to trigger an autocomplete dropdown to insert a cross-reference link to another requirement.

### 4.3 Search

- **Global search bar** (top bar): Full-text search across all requirement fields (title, description, rationale, acceptance criteria, comments).
- Results displayed as a dropdown list with highlighted matched text.
- Click result → navigate to requirement detail.
- **Advanced search dialog:**
  - Field-specific search (e.g., "title contains X AND status = Approved AND priority = High").
  - Regex support for text fields.
  - Save named search queries for reuse.
  - Search across custom attributes.

### 4.4 Notifications and Alerts (In-App Only)

Since there is no backend, notifications are in-app only:
- **Toast notifications** for successful operations (save, delete, import, export).
- **Alert badge** on Dashboard for: stale requirements, requirements with no traceability, open reviews with pending items.
- **Conflict warning** when editing a requirement that was modified in another browser tab (detected via IndexedDB change listeners or periodic polling).

### 4.5 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New requirement (in current module context) |
| `Ctrl+S` | Save current requirement |
| `Ctrl+F` | Focus global search |
| `Ctrl+Shift+F` | Open advanced search |
| `Esc` | Close detail panel / dialog |
| `↑ / ↓` | Navigate requirement list |
| `Enter` | Open selected requirement |
| `Ctrl+Z` | Undo last change (within editor) |
| `Ctrl+D` | Duplicate selected requirement |
| `Delete` | Delete selected requirement(s) (with confirmation) |

### 4.6 Undo/Redo

- Editor-level undo/redo for rich text fields (handled by TipTap/ProseMirror natively).
- Application-level undo for the last structural change (e.g., undo delete, undo status change). Maintain a stack of the last 20 operations.

### 4.7 Multi-Tab Safety

- Use IndexedDB transactions and `BroadcastChannel` API to detect concurrent edits from multiple browser tabs.
- If a requirement is modified in another tab, show a notification with options: "Reload" (fetch latest), "Overwrite" (force save), or "Merge" (show diff).

### 4.8 Offline / PWA Support

- Register a Service Worker to cache the application shell.
- App is fully functional offline (all data in IndexedDB).
- Manifest file for "Add to Home Screen" on mobile.
- Indicate online/offline status in the top bar.

---

## 5. Non-Functional Requirements

### 5.1 Performance

- **Initial load:** < 3 seconds on a modern browser (Chrome 120+, Firefox 120+, Edge 120+).
- **Requirement table:** Must render 5,000 requirements with smooth scrolling (virtual scrolling mandatory).
- **Search:** Return results within 200ms for projects with up to 10,000 requirements.
- **IndexedDB operations:** Individual read/write < 50ms. Bulk import of 1,000 requirements < 5 seconds.
- **Traceability graph:** Render up to 500 nodes with interactive performance (>30 FPS pan/zoom).

### 5.2 Data Limits

- Support up to **10 projects** concurrently.
- Support up to **10,000 requirements per project**.
- Support up to **50,000 traceability links per project**.
- Total IndexedDB storage target: < 500 MB (warn user at 80% of browser quota).

### 5.3 Browser Compatibility

- Chrome 120+, Firefox 120+, Edge 120+, Safari 17+.
- Responsive layout: Functional on tablets (1024px+). Read-only browsing on mobile (768px+). Full editing on desktop (1280px+).

### 5.4 Accessibility

- WCAG 2.1 AA compliance.
- All interactive elements keyboard-accessible.
- ARIA labels on all buttons, inputs, and dynamic regions.
- Screen reader compatible table navigation.
- High contrast mode (separate from dark mode).
- Focus indicators on all interactive elements.

### 5.5 Security

- No data leaves the browser (no network calls except CDN for initial load).
- Optional password protection for projects (encrypt IndexedDB entries with AES-256-GCM via Web Crypto API, key derived from user passphrase via PBKDF2).
- Export files can optionally be encrypted (password-protected ZIP).

---

## 6. UI/UX Design Guidelines

### 6.1 Visual Design

- **Color scheme:** Dark mode as default (dark navy/charcoal background `#1a1b2e`, lighter card surfaces `#252640`, vibrant accent blue `#4f8ff7` for primary actions). Light mode available as toggle.
- **Typography:** Inter or system font stack. 14px base size. Monospace (JetBrains Mono or Fira Code) for requirement IDs and code blocks.
- **Spacing:** 8px grid system. Consistent padding and margins.
- **Cards and surfaces:** Subtle border-radius (8px). Soft shadows in light mode. Subtle border outlines in dark mode (`1px solid rgba(255,255,255,0.08)`).
- **Status badges:** Pill-shaped, color-coded per status workflow definition. High contrast text.
- **Priority indicators:** Left border color accent on requirement rows — Critical: Red, High: Orange, Medium: Yellow, Low: Green, Undefined: Gray.

### 6.2 Interaction Patterns

- **Slide-over panel** for requirement detail (from right side, 60% width) to keep table context visible.
- **Modal dialogs** for destructive actions (delete, bulk operations) and creation forms (new project, new review).
- **Inline editing** for quick field changes — double-click to edit, click away or press Enter to save, Esc to cancel.
- **Drag and drop** for: reordering modules in tree, moving requirements between modules, reordering columns in table.
- **Context menus** (right-click) on: requirement rows, module tree nodes, traceability graph nodes.
- **Breadcrumb navigation** at the top of the content area: Project > Module > Requirement.
- **Empty states** with helpful illustrations and action buttons (e.g., "No requirements yet — create your first one").

### 6.3 Responsive Behavior

- **≥ 1280px:** Full layout with sidebar + content.
- **1024–1279px:** Collapsible sidebar (hamburger menu). Detail panel becomes full-width overlay.
- **768–1023px:** Sidebar hidden. Simplified table (fewer default columns). Detail view is full page.
- **< 768px:** Read-only browsing mode. Single-column layout. No inline editing.

---

## 7. File Structure

```
requirements-manager/
├── index.html                  # Entry point
├── vite.config.ts              # Build configuration
├── package.json
├── tsconfig.json
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   └── icons/                  # PWA icons (192x192, 512x512)
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Root component, routing, layout shell
│   ├── types/
│   │   ├── index.ts            # All TypeScript interfaces from data model
│   │   └── enums.ts            # Enum types
│   ├── store/
│   │   ├── projectStore.ts     # Zustand store for projects
│   │   ├── requirementStore.ts # Zustand store for requirements
│   │   ├── traceabilityStore.ts
│   │   ├── reviewStore.ts
│   │   ├── baselineStore.ts
│   │   ├── uiStore.ts          # UI state (sidebar, theme, active view)
│   │   └── historyStore.ts     # Undo/redo stack
│   ├── db/
│   │   ├── database.ts         # IndexedDB schema, migrations, CRUD operations
│   │   ├── backup.ts           # Full backup/restore logic
│   │   └── sync.ts             # BroadcastChannel multi-tab sync
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx    # Sidebar + TopBar + Content area
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── Breadcrumb.tsx
│   │   ├── common/
│   │   │   ├── DataTable.tsx   # Generic virtualized table with sorting, filtering, column config
│   │   │   ├── RichTextEditor.tsx  # TipTap editor wrapper
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── PriorityIndicator.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── TagInput.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── Toast.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardView.tsx
│   │   │   ├── StatusChart.tsx
│   │   │   ├── PriorityChart.tsx
│   │   │   ├── CoverageMetrics.tsx
│   │   │   └── ActivityFeed.tsx
│   │   ├── modules/
│   │   │   ├── ModuleTreeView.tsx
│   │   │   ├── ModuleTreeNode.tsx
│   │   │   └── ModuleForm.tsx
│   │   ├── requirements/
│   │   │   ├── RequirementsTableView.tsx
│   │   │   ├── RequirementDetailPanel.tsx
│   │   │   ├── RequirementForm.tsx
│   │   │   ├── RequirementHistoryTab.tsx
│   │   │   ├── RequirementCommentsTab.tsx
│   │   │   ├── RequirementAttachmentsTab.tsx
│   │   │   ├── RequirementTraceabilityTab.tsx
│   │   │   ├── BulkOperationsBar.tsx
│   │   │   └── RequirementPicker.tsx  # Searchable picker dialog for linking
│   │   ├── traceability/
│   │   │   ├── TraceabilityMatrixView.tsx
│   │   │   ├── TraceabilityGraphView.tsx
│   │   │   ├── GraphNode.tsx
│   │   │   ├── GraphEdge.tsx
│   │   │   └── ImpactAnalysisPanel.tsx
│   │   ├── reviews/
│   │   │   ├── ReviewsListView.tsx
│   │   │   ├── ReviewWorkspace.tsx
│   │   │   ├── ReviewItemCard.tsx
│   │   │   └── CreateReviewDialog.tsx
│   │   ├── baselines/
│   │   │   ├── BaselinesListView.tsx
│   │   │   ├── BaselineDetailView.tsx
│   │   │   └── BaselineCompareView.tsx
│   │   ├── reports/
│   │   │   ├── ReportsView.tsx
│   │   │   ├── ReportGenerator.ts  # PDF/Excel generation logic
│   │   │   └── ReportPreview.tsx
│   │   ├── import-export/
│   │   │   ├── ImportExportView.tsx
│   │   │   ├── CsvImporter.tsx
│   │   │   ├── ReqifImporter.tsx
│   │   │   ├── JsonImporter.tsx
│   │   │   ├── ColumnMapper.tsx   # UI for mapping CSV/Excel columns
│   │   │   └── ExportOptions.tsx
│   │   └── settings/
│   │       ├── SettingsView.tsx
│   │       ├── WorkflowDesigner.tsx  # Visual status workflow editor
│   │       ├── CustomAttributeManager.tsx
│   │       ├── CategoryEditor.tsx
│   │       └── DataManagement.tsx
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useVirtualScroll.ts
│   │   └── useMultiTabSync.ts
│   ├── utils/
│   │   ├── idGenerator.ts      # UUID v4 + display ID generation
│   │   ├── diffEngine.ts       # Field-level diff for history and baseline comparison
│   │   ├── richTextUtils.ts    # Strip rich text to plain text, extract mentions
│   │   ├── reqifParser.ts      # ReqIF XML parser
│   │   ├── reqifExporter.ts    # ReqIF XML generator
│   │   ├── csvParser.ts
│   │   ├── encryption.ts       # Web Crypto AES-256-GCM encrypt/decrypt
│   │   ├── dateFormat.ts
│   │   └── searchEngine.ts     # In-memory full-text search index (inverted index)
│   └── styles/
│       ├── globals.css         # Tailwind directives, CSS variables, dark/light theme
│       └── print.css           # Print-specific styles for reports
```

---

## 8. IndexedDB Schema

```
Database: "RequirementsManager"
Version: 1

Object Stores:
  - projects        (keyPath: "id", indexes: [name])
  - requirements     (keyPath: "id", indexes: [projectId, displayId, moduleId, status, priority, type, updatedAt])
  - modules          (keyPath: "id", indexes: [projectId, parentModuleId])
  - traceabilityLinks (keyPath: "id", indexes: [projectId, sourceRequirementId, targetRequirementId, linkType])
  - baselines        (keyPath: "id", indexes: [projectId, createdAt])
  - reviews          (keyPath: "id", indexes: [projectId, status])
  - changeHistory    (keyPath: "id", indexes: [projectId, requirementId, timestamp, author])
  - appSettings      (keyPath: "key")  // For global app preferences
```

---

## 9. Key Implementation Notes

### 9.1 Search Index

Build an in-memory inverted index on application load for the active project. Index fields: displayId, title, description (plain text extracted), rationale, acceptanceCriteria, tags, owner, source, comment text. Rebuild index incrementally on requirement create/update/delete. Use a simple TF-IDF scoring for result ranking.

### 9.2 Traceability Graph Rendering

Use D3.js `forceSimulation` for force-directed layout with:
- `forceLink` with distance proportional to link type weight.
- `forceManyBody` with negative charge for repulsion.
- `forceCenter` to keep the graph centered.
- `forceCollide` to prevent node overlap.
- SVG rendering with `<g>` groups for nodes and edges.
- Zoom via `d3.zoom()` behavior attached to the SVG container.

For hierarchical layout, use `d3.tree()` or `d3.cluster()` with `d3.hierarchy()` from link data.

### 9.3 Virtual Scrolling

Implement a virtualized table renderer that:
- Only renders DOM rows visible in the viewport + a buffer of 10 rows above/below.
- Maintains a spacer element above and below the visible rows to preserve scroll position.
- Handles variable row heights if rich text previews are shown.
- Re-measures on window resize.

### 9.4 ReqIF Parsing

ReqIF (Requirements Interchange Format) is an XML-based standard. Key mapping:
- `<SPEC-OBJECT>` → Requirement
- `<SPEC-RELATION>` → TraceabilityLink
- `<SPECIFICATION>` → Module
- `<DATATYPE-DEFINITION-*>` → CustomAttributeDefinition
- `<ATTRIBUTE-VALUE-*>` → Requirement field values

Use the browser's built-in `DOMParser` for XML parsing. Handle XHTML content in `<ATTRIBUTE-VALUE-XHTML>` fields.

### 9.5 PDF Generation

Use jsPDF with:
- Auto-table plugin for tabular data.
- Custom fonts loaded via base64 embedding.
- Cover page with project metadata.
- Auto-generated table of contents with page numbers.
- Header/footer with project name, page numbers, generation timestamp.
- Page breaks between modules/sections.

### 9.6 Workflow Designer

Implement the visual workflow editor as:
- A canvas (SVG or HTML5 Canvas) where status nodes are positioned.
- Nodes are draggable rectangles with the status name and color.
- Arrows drawn between nodes represent allowed transitions.
- Click on canvas → add new status node.
- Drag from node edge → draw a new transition arrow to another node.
- Click on node → edit properties (name, color, initial/final flags).
- Click on arrow → edit transition label or delete.
- Validate: Exactly one initial status. At least one final status. All non-final statuses must have at least one outgoing transition.

---

## 10. Sample Default Data

On first launch (no existing data), create a **demo project** with:
- Project name: "Sample Autonomous Vehicle Requirements"
- Prefix: "AV"
- 5 modules: "Stakeholder Needs", "System Requirements", "Software Requirements", "Hardware Requirements", "Test Cases"
- 20 sample requirements spread across modules, with varied types, priorities, and statuses.
- 15 traceability links showing a hierarchy: Stakeholder → System → Software/Hardware → Test.
- 1 baseline snapshot.
- 1 open review with 5 items.
- Default status workflow: Draft → In Review → Approved → Implemented → Verified (with Rejected and Deferred as side branches).
- 2 custom attributes: "Verification Method" (enum: Analysis, Inspection, Demonstration, Test) and "Safety Criticality" (enum: ASIL-A, ASIL-B, ASIL-C, ASIL-D, QM).

---

## 11. Acceptance Criteria for the Complete Application

1. User can create a new project with custom prefix, name, and settings.
2. User can define, edit, and delete modules in a hierarchical tree.
3. User can create, edit, duplicate, and delete requirements with all fields.
4. Auto-generated display IDs follow the configured format and never repeat.
5. Rich text editor supports all specified formatting options and `@REQ-` cross-references.
6. Requirements table supports sorting, filtering, column customization, inline editing, and bulk operations.
7. Virtual scrolling handles 5,000+ requirements without UI lag.
8. Traceability links can be created and removed between any two requirements.
9. Traceability matrix view renders correctly and allows click-to-link.
10. Traceability graph renders with force-directed and hierarchical layouts, supports zoom/pan, and highlights impact chains.
11. Status workflow transitions are enforced — only valid transitions are offered in the UI.
12. Visual workflow designer allows creating and editing status workflows via drag-and-drop.
13. Custom attributes are definable per project and appear in requirement forms and table columns.
14. Full change history is recorded for every requirement modification.
15. Baselines can be created, viewed, and compared with field-level diffs.
16. Reviews can be created, items dispositioned, and reviews closed.
17. All reports generate correctly as PDF and/or Excel.
18. Import works for JSON, CSV (with column mapping), and ReqIF formats.
19. Export works for JSON, CSV, ReqIF, Excel, PDF, and standalone HTML.
20. Global search returns results within 200ms with highlighted matches.
21. Dark mode and light mode both render correctly.
22. All keyboard shortcuts function as specified.
23. Multi-tab editing conflict detection works via BroadcastChannel.
24. PWA install and offline operation work correctly.
25. Demo project loads on first launch with realistic sample data.
26. All data persists across browser sessions via IndexedDB.
27. Full project backup and restore via JSON export/import works correctly.
28. Application loads in under 3 seconds on Chrome 120+.

---

## 12. Out of Scope

The following are explicitly **not** included in this version:

- Multi-user real-time collaboration (no WebSocket/CRDT sync).
- Server-side storage or any backend API.
- User authentication or role-based access control (beyond optional passphrase encryption).
- Integration with external tools (Jira, Azure DevOps, Git) — except via ReqIF import/export.
- Requirements auto-generation via AI/LLM.
- Formal verification or model checking.
- Variant/configuration management (150% model).
- Test execution tracking (only test case requirements are in scope).
