import React, { useState, useEffect } from "react";
import { FaSpinner, FaCheckCircle, FaUserShield, FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import BaseModal from "./BaseModal";

const UserFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  loading = false,
  editData = null
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (editData) {
        setFormData({
          name: editData.name || "",
          email: editData.email || "",
          password: "", // Password always empty for editing
        });
      } else {
        setFormData({
          name: "",
          email: "",
          password: "",
        });
      }
    }
  }, [isOpen, editData]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Identification required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Communication endpoint required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid endpoint format";
    }

    if (!editData) {
      if (!formData.password) {
        newErrors.password = "Security token required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Complexity failure (min 6 characters)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? "Update Credentials" : "Index New Identity"}
      size="sm"
      footer={
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-grow px-6 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
            style={{ color: 'var(--page-text)' }}
          >
            Abort
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-grow px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
            <span>{editData ? "Commit Updates" : "Register Access"}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-3 text-indigo-600 shadow-inner">
            <FaUserShield size={28} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
            System Identity Management
          </p>
          <h4 className="text-xl font-black mt-1" style={{ color: 'var(--page-text)' }}>
            {editData ? "Modify Authorization" : "New Sub-Admin"}
          </h4>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">
            Legal Full Name
          </label>
          <div className="relative">
            <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/30" size={12} />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Alexander Pierce"
              className={`w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none ${
                errors.name ? "border-rose-500/50" : "border-transparent"
              }`}
              style={{ color: 'var(--page-text)' }}
            />
          </div>
          {errors.name && <p className="text-[9px] text-rose-500 mt-1 font-black uppercase tracking-tighter ml-2">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">
            Authentication Endpoint
          </label>
          <div className="relative">
            <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/30" size={12} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. apierce@enterprise.com"
              className={`w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none ${
                errors.email ? "border-rose-500/50" : "border-transparent"
              }`}
              style={{ color: 'var(--page-text)' }}
            />
          </div>
          {errors.email && <p className="text-[9px] text-rose-500 mt-1 font-black uppercase tracking-tighter ml-2">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">
            Security Key {editData && "(Optional)"}
          </label>
          <div className="relative">
            <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/30" size={12} />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={editData ? "••••••••" : "Minimum 6 characters"}
              className={`w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none ${
                errors.password ? "border-rose-500/50" : "border-transparent"
              }`}
              style={{ color: 'var(--page-text)' }}
            />
          </div>
          {errors.password && <p className="text-[9px] text-rose-500 mt-1 font-black uppercase tracking-tighter ml-2">{errors.password}</p>}
          {editData && <p className="text-[9px] font-bold opacity-30 uppercase tracking-tighter ml-2">Leave blank to maintain current encryption</p>}
        </div>

        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
          <p className="text-[10px] font-bold text-amber-600/60 leading-relaxed text-center">
            Privileged accounts possess authority to manage catalog assets, financial records, and operational logistics.
          </p>
        </div>
      </form>
    </BaseModal>
  );
};

export default UserFormModal;
