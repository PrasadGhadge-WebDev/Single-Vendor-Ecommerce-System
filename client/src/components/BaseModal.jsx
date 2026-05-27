import React, { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

const BaseModal = ({ isOpen, onClose, title, children, footer, size = "md" }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-[1060] flex items-start justify-center overflow-x-hidden overflow-y-auto lg:pl-[280px] pt-8 md:pt-16 pb-8">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div 
        className={`relative z-[1061] w-full ${sizeClasses[size] || sizeClasses.md} p-4 sm:p-6 transform transition-all duration-300 ease-out animate-in fade-in zoom-in slide-in-from-bottom-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="rounded-[1.5rem] shadow-2xl border overflow-hidden flex flex-col max-h-[calc(100vh-120px)]"
          style={{ 
            backgroundColor: 'var(--surface-1)', 
            borderColor: 'var(--border-color)',
            color: 'var(--page-text)'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 md:p-5 border-b shrink-0"
            style={{ 
              backgroundColor: 'var(--surface-2)', 
              borderColor: 'var(--border-color)' 
            }}
          >
            <h3 className="text-lg md:text-xl font-bold font-outfit tracking-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-all shadow-sm border"
              style={{ 
                color: 'var(--page-text-muted)', 
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--surface-1)'
              }}
              aria-label="Close"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 overflow-y-auto scrollbar-thin flex-grow">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div 
              className="p-4 md:p-5 border-t shrink-0 flex items-center justify-end gap-3"
              style={{ 
                backgroundColor: 'var(--surface-2)', 
                borderColor: 'var(--border-color)' 
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;
