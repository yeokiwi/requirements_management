import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useProjectStore } from '@/store/projectStore';

const TopBar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    setActiveView,
    userName,
    theme,
    setTheme,
    activeProjectId,
    setActiveProject,
  } = useUIStore();
  const { projects } = useProjectStore();

  const [online, setOnline] = useState(navigator.onLine);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentProject = projects.find((p) => p.id === activeProjectId);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="h-14 flex items-center px-4 gap-4 border-b shrink-0"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Project Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-text)' }}
          onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
        >
          {/* Folder icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <span className="max-w-[160px] truncate">
            {currentProject?.name ?? 'Select Project'}
          </span>
          {/* Chevron */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {projectDropdownOpen && (
          <div
            className="absolute top-full left-0 mt-1 w-56 rounded-md shadow-lg py-1 z-50 border"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            {projects.length === 0 && (
              <div
                className="px-3 py-2 text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                No projects
              </div>
            )}
            {projects.map((project) => (
              <button
                key={project.id}
                className="w-full text-left px-3 py-2 text-sm hover:opacity-80 transition-opacity"
                style={{
                  color: 'var(--color-text)',
                  backgroundColor:
                    project.id === activeProjectId
                      ? 'var(--color-surface-hover)'
                      : 'transparent',
                }}
                onClick={() => {
                  setActiveProject(project.id);
                  setProjectDropdownOpen(false);
                }}
              >
                {project.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-md mx-auto relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-1.5 rounded-md text-sm border outline-none"
          style={{
            backgroundColor: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Settings button */}
        <button
          className="p-1.5 rounded-md hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-text-secondary)' }}
          onClick={() => setActiveView('settings')}
          title="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>

        {/* Theme toggle */}
        <button
          className="p-1.5 rounded-md hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-text-secondary)' }}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            /* Sun icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            /* Moon icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>

        {/* Online/offline indicator */}
        <div className="flex items-center gap-1.5" title={online ? 'Online' : 'Offline'}>
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: online ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          />
        </div>

        {/* User name */}
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {userName}
        </span>
      </div>
    </header>
  );
};

export default TopBar;
