import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative flex min-h-full items-start justify-center px-4 py-4 sm:items-center sm:px-6 sm:py-6">
        <div
          ref={panelRef}
          className={`
            relative flex max-h-[calc(100dvh-2rem)] w-full ${sizes[size]} flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transform transition-all
            sm:max-h-[calc(100dvh-3rem)]
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {(title || showClose) && (
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:items-center sm:px-6 sm:py-4">
              {title && (
                <h2 className="max-w-[calc(100%-2.5rem)] text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                  {title}
                </h2>
              )}
              {showClose && (
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
