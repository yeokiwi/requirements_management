import React, { useState, useMemo } from 'react';
import type { Module } from '@/types';

interface ModuleTreeNodeProps {
  module: Module;
  modules: Module[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, module: Module) => void;
  level: number;
}

export const ModuleTreeNode: React.FC<ModuleTreeNodeProps> = ({
  module,
  modules,
  selectedId,
  onSelect,
  onContextMenu,
  level,
}) => {
  const [expanded, setExpanded] = useState(false);

  const children = useMemo(
    () => modules.filter((m) => m.parentModuleId === module.id),
    [modules, module.id],
  );

  const hasChildren = children.length > 0;
  const isSelected = selectedId === module.id;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 px-2 cursor-pointer rounded-md text-sm select-none transition-colors duration-75 ${
          isSelected ? 'font-semibold' : 'hover:brightness-110'
        }`}
        style={{
          paddingLeft: `${level * 16 + 8}px`,
          backgroundColor: isSelected ? 'var(--color-accent)' : 'transparent',
          color: isSelected ? '#fff' : 'var(--color-text)',
        }}
        onClick={() => onSelect(module.id)}
        onContextMenu={(e) => onContextMenu(e, module)}
      >
        {/* Expand / collapse toggle */}
        <button
          type="button"
          className="flex items-center justify-center w-4 h-4 shrink-0"
          style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
          onClick={handleToggle}
        >
          <svg
            className="w-3.5 h-3.5 transition-transform duration-150"
            style={{
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              color: isSelected ? '#fff' : 'var(--color-text-secondary)',
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Folder icon */}
        <svg
          className="w-4 h-4 shrink-0"
          style={{ color: isSelected ? '#fff' : 'var(--color-accent)' }}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {expanded && hasChildren ? (
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v1H4a2 2 0 00-2 2v4l1.6-6.4A2 2 0 015.5 7H18v-1a2 2 0 00-2-2h-5l-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h12l2.4-8H4L2 16V6z" />
          ) : (
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          )}
        </svg>

        {/* Module name */}
        <span className="truncate">{module.name}</span>
      </div>

      {/* Children */}
      {expanded &&
        hasChildren &&
        children.map((child) => (
          <ModuleTreeNode
            key={child.id}
            module={child}
            modules={modules}
            selectedId={selectedId}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            level={level + 1}
          />
        ))}
    </div>
  );
};

export default ModuleTreeNode;
