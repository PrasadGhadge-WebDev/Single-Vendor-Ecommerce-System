import React, { useContext, useEffect, useState } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { FaUserCircle, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock, FaCamera, FaSave, FaSync, FaShieldAlt, FaKey } from "react-icons/fa";

const AdminProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/users/me");
      setForm((prev) => ({
        ...prev,
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
      }));
      setCapturedImage(data.profileImage || "");
      setCreatedAt(data.createdAt || "");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.warning("Please select a valid image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.warning("Core credentials are required");
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      toast.warning("Password parity check failed");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        profileImage: capturedImage || "",
      };
      if (form.password) {
        payload.password = form.password;
      }

      const { data } = await API.put("/users/me", payload);
      updateUser(data);
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      toast.success("Security profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 opacity-30">
      <FaSync className="animate-spin text-indigo-600 mb-4" size={30} />
      <p className="text-sm font-black uppercase tracking-widest">Retrieving Credentials...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-700" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">Security Profile</h1>
          <p className="text-sm text-gray-500 m-0 mt-1">MANAGE YOUR ADMINISTRATIVE IDENTITY AND SECURITY PARAMETERS</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/60 rounded-[2.5rem] border shadow-2xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
          
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl transition-all group-hover:scale-105 duration-500">
                {capturedImage ? (
                  <img src={capturedImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FaUserCircle className="text-slate-300" size={80} />
                )}
              </div>
              <label className="absolute -right-2 -bottom-2 w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-xl flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-all active:scale-90 group-hover:rotate-12">
                <FaCamera size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
              </label>
            </div>
            <div className="text-center md:text-left space-y-2">
              <h3 className="text-2xl font-black" style={{ color: 'var(--page-text)' }}>{form.name || "Anonymous Admin"}</h3>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-600/20">
                  {user?.isSuperAdmin ? "Super Administrator" : "Regional Manager"}
                </span>
                <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">
                  Active since {createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : "Initial Epoch"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Display Name</label>
                <div className="relative">
                  <FaUserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/30" size={14} />
                  <input name="name" value={form.name} onChange={handleChange} className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Email Endpoint</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/30" size={14} />
                  <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Secure Mobile</label>
                <div className="relative">
                  <FaPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/30" size={14} />
                  <input name="phone" value={form.phone} onChange={handleChange} className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Primary Worksite</label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-5 top-4 text-indigo-500/30" size={14} />
                  <textarea name="address" value={form.address} onChange={handleChange} className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none min-h-[100px]" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-transparent space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <FaShieldAlt className="text-indigo-600" size={16} />
                  <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--page-text)' }}>Security Credentials</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">New Access Token</label>
                  <div className="relative">
                    <FaKey className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/30" size={14} />
                    <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Re-verify Token</label>
                  <div className="relative">
                    <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500/30" size={14} />
                    <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 transition-all outline-none" />
                  </div>
                </div>
                <p className="text-[10px] font-bold opacity-30 uppercase tracking-tighter text-center">Leave blank to maintain existing security key</p>
              </div>
              
              <div className="flex flex-col gap-3 pt-6">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                >
                  <FaSave size={16} className={saving ? "animate-spin" : "group-hover:scale-110 transition-transform"} />
                  <span>{saving ? "Synchronizing..." : "Update Security Profile"}</span>
                </button>
                <button 
                  type="button" 
                  onClick={loadProfile}
                  className="w-full px-8 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <FaSync size={14} />
                  <span>Reset Changes</span>
                </button>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
