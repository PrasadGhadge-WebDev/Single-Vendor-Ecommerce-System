import React from "react";
import BaseModal from "./BaseModal";
import { FaExclamationTriangle } from "react-icons/fa";

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) => {
  const typeStyles = {
    danger: {
      icon: "text-rose-500",
      bg: "bg-rose-500/10",
      btn: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
    },
    warning: {
      icon: "text-amber-500",
      bg: "bg-amber-500/10",
      btn: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
    },
    info: {
      icon: "text-indigo-500",
      bg: "bg-indigo-500/10",
      btn: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
    }
  };

  const currentStyle = typeStyles[type] || typeStyles.info;

  const footer = (
    <>
      <button
        onClick={onClose}
        className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
        style={{ color: 'var(--page-text-muted)' }}
      >
        {cancelText}
      </button>
      <button
        onClick={() => {
          onConfirm();
          onClose();
        }}
        className={`px-8 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all active:scale-95 ${currentStyle.btn}`}
      >
        {confirmText}
      </button>
    </>
  );

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title} 
      footer={footer}
      size="sm"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`w-16 h-16 rounded-3xl ${currentStyle.bg} flex items-center justify-center ${currentStyle.icon}`}>
          <FaExclamationTriangle size={32} />
        </div>
        <p className="text-base font-medium opacity-80 leading-relaxed">
          {message}
        </p>
      </div>
    </BaseModal>
  );
};

export default ConfirmModal;
