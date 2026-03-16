import React, { lazy, Suspense } from 'react';
import { useUIStore, type ActiveView } from '@/store/uiStore';
import { useProjectStore } from '@/store/projectStore';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Breadcrumb, { type BreadcrumbItem } from './Breadcrumb';

// ---------------------------------------------------------------------------
// Lazy-loaded view components (placeholders for now)
// ---------------------------------------------------------------------------

const ViewPlaceholder: React.FC<{ name: string }> = ({ name }) => (
  <div
    className="flex items-center justify-center h-full"
    style={{ color: 'var(--color-text-secondary)' }}
  >
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        {name}
      </h2>
      <p className="text-sm">This view is not yet implemented.</p>
    </div>
  </div>
);

// Lazy-loaded view factories. Each resolves to a module with a default export.
// When actual view components are built, replace these with real imports such as:
//   const DashboardView = lazy(() => import('@/components/dashboard/DashboardView'));

const DashboardView = lazy(() =>
  Promise.resolve({ default: () => <ViewPlaceholder name="Dashboard" /> })
);
const ModulesView = lazy(() =>
  Promise.resolve({ default: () => <ViewPlaceholder name="Modules" /> })
);
const RequirementsView = lazy(() =>
  Promise.resolve({ default: () => <ViewPlaceholder name="Requirements" /> })
);
const TraceabilityMatrixView = lazy(() =>
  Promise.resolve({ default: () => <ViewPlaceholder name="Traceability Matrix" /> })
);
const TraceabilityGraphView = lazy(() =>
  Promise.resolve({ default: () => <ViewPlaceholder name="Traceability Graph" /> })
);
const ReviewsView = lazy(() =>
  Promise.resolve({ default: () => <ViewPlaceholder name="Reviews" /> })
);
const BaselinesView = lazy(() =>
  Promise.resolve({ default: () => <ViewPlaceholder name="Baselines" /> })
);
const ReportsView = lazy(() =>
  Promise.resolve({ default: () => <ViewPlaceholder name="Reports" /> })
);
const ImportExportView = lazy(() =>
  Promise.resolve({ default: () => <ViewPlaceholder name="Import / Export" /> })
);
const SettingsView = lazy(() =>
  Promise.resolve({ default: () => <ViewPlaceholder name="Settings" /> })
);

// ---------------------------------------------------------------------------
// View label mapping
// ---------------------------------------------------------------------------

const viewLabels: Record<ActiveView, string> = {
  dashboard: 'Dashboard',
  modules: 'Modules',
  requirements: 'Requirements',
  'traceability-matrix': 'Traceability Matrix',
  'traceability-graph': 'Traceability Graph',
  reviews: 'Reviews',
  baselines: 'Baselines',
  reports: 'Reports',
  'import-export': 'Import / Export',
  settings: 'Settings',
};

// ---------------------------------------------------------------------------
// View renderer
// ---------------------------------------------------------------------------

const renderView = (view: ActiveView): React.ReactNode => {
  switch (view) {
    case 'dashboard':
      return <DashboardView />;
    case 'modules':
      return <ModulesView />;
    case 'requirements':
      return <RequirementsView />;
    case 'traceability-matrix':
      return <TraceabilityMatrixView />;
    case 'traceability-graph':
      return <TraceabilityGraphView />;
    case 'reviews':
      return <ReviewsView />;
    case 'baselines':
      return <BaselinesView />;
    case 'reports':
      return <ReportsView />;
    case 'import-export':
      return <ImportExportView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <ViewPlaceholder name="Unknown View" />;
  }
};

// ---------------------------------------------------------------------------
// Loading fallback
// ---------------------------------------------------------------------------

const LoadingFallback: React.FC = () => (
  <div
    className="flex items-center justify-center h-full"
    style={{ color: 'var(--color-text-secondary)' }}
  >
    <span className="text-sm">Loading...</span>
  </div>
);

// ---------------------------------------------------------------------------
// AppShell
// ---------------------------------------------------------------------------

const AppShell: React.FC = () => {
  const { activeView, setActiveView, activeProjectId } = useUIStore();
  const { projects } = useProjectStore();

  const currentProject = projects.find((p) => p.id === activeProjectId);

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [];
  if (currentProject) {
    breadcrumbItems.push({
      label: currentProject.name,
      onClick: () => setActiveView('dashboard'),
    });
  }
  breadcrumbItems.push({ label: viewLabels[activeView] });

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: 'var(--color-bg)' }}>
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Breadcrumb items={breadcrumbItems} />
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<LoadingFallback />}>
              {renderView(activeView)}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
