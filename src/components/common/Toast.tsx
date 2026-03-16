import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import type { Toast as ToastType } from '@/store/uiStore';

const BORDER_COLORS: Record<ToastType['type'], string> = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#3b82f6',
  warning: '#eab308',
};

const ToastItem: React.FC<{ toast: ToastType; onClose: (id: string) => void }> = ({
  toast,
  onClose,
}) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const duration = toast.duration ?? 3000;
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-md shadow-lg min-w-[300px] max-w-[420px] transition-all duration-300"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderLeft: `4px solid ${BORDER_COLORS[toast.type]}`,
        color: 'var(--color-text)',
        opacity: visible && !exiting ? 1 : 0,
        transform: visible && !exiting ? 'translateX(0)' : 'translateX(100%)',
      }}
    >
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        type="button"
        className="shrink-0 text-sm opacity-60 hover:opacity-100"
        style={{ color: 'var(--color-text-secondary)' }}
        onClick={handleClose}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
