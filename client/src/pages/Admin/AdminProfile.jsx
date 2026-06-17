import React, { useContext, useEffect, useState } from "react";
import API from "../../api";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { 
  FaUserCircle, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock, FaCamera, 
  FaSave, FaSync, FaShieldAlt, FaKey, FaBox, FaShoppingCart, FaUsers, 
  FaTruck, FaMoneyBillWave, FaClock, FaHistory, FaBell, FaCheck, FaTimes,
  FaMobileAlt, FaVenusMars, FaBirthdayCake, FaGlobe, FaCity, FaAddressCard
} from "react-icons/fa";

const AdminProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("profile");
  
  const [profileForm, setProfileForm] = useState({
    name: "", email: "", phone: "", altMobile: "", gender: "Prefer Not to Say", 
    dateOfBirth: "", address: "", city: "", state: "", country: "", pincode: "",
    employeeId: "", joiningDate: "", lastLoginIp: ""
  });
  
  const [securityForm, setSecurityForm] = useState({
    password: "", confirmPassword: "", twoFactorEnabled: false
  });
  
  const [notifications, setNotifications] = useState({
    orderNotifications: true, paymentNotifications: true, returnRequests: true,
    lowStockAlerts: true, supplierNotifications: true, systemAnnouncements: true, emailNotifications: true
  });
  
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0, totalOrders: 0, totalUsers: 0, totalSuppliers: 0, totalPurchases: 0, lastLogin: null
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes, actRes] = await Promise.all([
        API.get("/users/me"),
        API.get("/users/me/dashboard-stats"),
        API.get("/users/me/activities")
      ]);
      
      const pData = profileRes.data;
      setProfileForm({
        name: pData.name || "",
        email: pData.email || "",
        phone: pData.phone || "",
        altMobile: pData.altMobile || "",
        gender: pData.gender || "Prefer Not to Say",
        dateOfBirth: pData.dateOfBirth ? new Date(pData.dateOfBirth).toISOString().split('T')[0] : "",
        address: pData.address || "",
        city: pData.city || "",
        state: pData.state || "",
        country: pData.country || "",
        pincode: pData.pincode || "",
        employeeId: pData.employeeId || `EMP-${pData._id.toString().substring(0, 6).toUpperCase()}`,
        joiningDate: pData.joiningDate || pData.createdAt,
        lastLoginIp: pData.lastLoginIp || "192.168.1.1" // Mock IP for display
      });
      setCapturedImage(pData.profileImage || "");
      setCreatedAt(pData.createdAt || "");
      
      if (pData.twoFactorAuth) {
        setSecurityForm(prev => ({ ...prev, twoFactorEnabled: pData.twoFactorAuth.enabled }));
      }
      if (pData.notificationPreferences) {
        setNotifications(pData.notificationPreferences);
      }
      
      setStats(statsRes.data);
      setActivities(actRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.warning("Please select a valid image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.warning("Maximum image size is 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setCapturedImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name === "name" && /\d/.test(value)) return; // No numbers allowed in name
    if (name === "phone" && value.length > 10) return; // Max 10 digits
    if (name === "altMobile" && value.length > 10) return; // Max 10 digits
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (profileForm.name.length < 3) return toast.warning("Full name must be at least 3 characters");
    if (profileForm.phone && profileForm.phone.length !== 10) return toast.warning("Mobile number must be exactly 10 digits");
    
    try {
      setSaving(true);
      const { data } = await API.put("/users/me/profile", { ...profileForm, profileImage: capturedImage });
      updateUser(data);
      toast.success("Profile Information Updated!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const saveSecurity = async (e) => {
    e.preventDefault();
    if (securityForm.password) {
      const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])(?=.{8,})");
      if (!strongRegex.test(securityForm.password)) {
        return toast.warning("Password must contain 8+ characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character");
      }
      if (securityForm.password !== securityForm.confirmPassword) {
        return toast.warning("Passwords do not match");
      }
    }
    try {
      setSaving(true);
      await API.put("/users/me/security", { 
        password: securityForm.password || undefined,
        twoFactorEnabled: securityForm.twoFactorEnabled 
      });
      setSecurityForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
      toast.success("Security Settings Updated!");
    } catch (error) {
      toast.error("Failed to update security settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = async (key) => {
    const newPrefs = { ...notifications, [key]: !notifications[key] };
    setNotifications(newPrefs);
    try {
      await API.put("/users/me/notifications", newPrefs);
      toast.success("Preferences saved");
    } catch (error) {
      setNotifications(notifications); // Revert on failure
      toast.error("Failed to save preference");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 opacity-30">
      <FaSync className="animate-spin text-indigo-600 mb-4" size={30} />
      <p className="text-sm font-black uppercase tracking-widest">Retrieving Credentials...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-700 bg-slate-50 min-h-screen">
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><FaBox className="text-indigo-500"/> Total Products</p>
          <p className="text-xl font-black text-slate-800">{stats.totalProducts}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><FaShoppingCart className="text-emerald-500"/> Total Orders</p>
          <p className="text-xl font-black text-slate-800">{stats.totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><FaUsers className="text-blue-500"/> Total Users</p>
          <p className="text-xl font-black text-slate-800">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><FaTruck className="text-amber-500"/> Total Suppliers</p>
          <p className="text-xl font-black text-slate-800">{stats.totalSuppliers}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><FaMoneyBillWave className="text-purple-500"/> Total Purchases</p>
          <p className="text-xl font-black text-slate-800">{stats.totalPurchases}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><FaClock className="text-rose-500"/> Last Login</p>
          <p className="text-xs font-black text-slate-800 break-words">{stats.lastLogin ? new Date(stats.lastLogin).toLocaleString() : "Just Now"}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar Profile Card & Tabs */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
            <div className="px-6 pb-6 relative">
              <div className="relative w-28 h-28 -mt-14 mx-auto rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden group">
                {capturedImage ? (
                  <img src={capturedImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FaUserCircle className="text-slate-200 w-full h-full" />
                )}
                <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <FaCamera size={20} />
                  <span className="text-[9px] font-black uppercase mt-1">Upload</span>
                  <input type="file" accept="image/jpeg, image/png, image/jpg" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <div className="text-center mt-4 space-y-1">
                <h3 className="text-xl font-black text-slate-800">{profileForm.name || "Anonymous Admin"}</h3>
                <p className="text-xs font-bold text-slate-500">{user?.isSuperAdmin ? "Super Administrator" : "Administrator"}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Account
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-3 flex flex-col gap-1">
            <button onClick={() => setActiveTab("profile")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "profile" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <FaUserCircle size={16} /> Profile & Personal Info
            </button>
            <button onClick={() => setActiveTab("security")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "security" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <FaShieldAlt size={16} /> Security Settings
            </button>
            <button onClick={() => setActiveTab("notifications")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "notifications" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <FaBell size={16} /> Notification Preferences
            </button>

          </div>
        </div>

        {/* Right Content Area */}
        <div className="w-full lg:w-2/3">
          
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Profile Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee ID</p>
                  <p className="text-sm font-bold text-slate-800">{profileForm.employeeId}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Role</p>
                  <p className="text-sm font-bold text-slate-800">{user?.isSuperAdmin ? "Super Admin" : "Admin"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Joining Date</p>
                  <p className="text-sm font-bold text-slate-800">{new Date(profileForm.joiningDate).toLocaleDateString()}</p>
                </div>
              </div>

              <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Personal Information</h2>
              <form onSubmit={saveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name *</label>
                    <div className="relative">
                      <FaUserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input name="name" value={profileForm.name} onChange={handleProfileChange} required minLength={3} className="w-full !pl-11 !pr-4 !py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 ring-indigo-500/20 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address *</label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="email" name="email" value={profileForm.email} onChange={handleProfileChange} required className="w-full !pl-11 !pr-4 !py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 ring-indigo-500/20 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Number *</label>
                    <div className="relative">
                      <FaMobileAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" name="phone" value={profileForm.phone} onChange={handleProfileChange} required className="w-full !pl-11 !pr-4 !py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 ring-indigo-500/20 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Alternate Mobile</label>
                    <div className="relative">
                      <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" name="altMobile" value={profileForm.altMobile} onChange={handleProfileChange} className="w-full !pl-11 !pr-4 !py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 ring-indigo-500/20 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gender</label>
                    <div className="relative">
                      <FaVenusMars className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select name="gender" value={profileForm.gender} onChange={handleProfileChange} className="w-full !pl-11 !pr-4 !py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 ring-indigo-500/20 outline-none transition-all appearance-none cursor-pointer">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer Not to Say">Prefer Not to Say</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date of Birth</label>
                    <div className="relative">
                      <FaBirthdayCake className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="date" name="dateOfBirth" value={profileForm.dateOfBirth} onChange={handleProfileChange} className="w-full !pl-11 !pr-4 !py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 ring-indigo-500/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Address</label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-4 top-4 text-slate-400" />
                    <textarea name="address" value={profileForm.address} onChange={handleProfileChange} className="w-full !pl-11 !pr-4 !py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 ring-indigo-500/20 outline-none transition-all min-h-[80px]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">City</label>
                    <div className="relative">
                      <FaCity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12}/>
                      <input name="city" value={profileForm.city} onChange={handleProfileChange} className="w-full !pl-8 !pr-3 !py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:bg-white focus:ring-2 ring-indigo-500/20 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">State</label>
                    <div className="relative">
                      <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12}/>
                      <input name="state" value={profileForm.state} onChange={handleProfileChange} className="w-full !pl-8 !pr-3 !py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:bg-white focus:ring-2 ring-indigo-500/20 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Country</label>
                    <div className="relative">
                      <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12}/>
                      <input name="country" value={profileForm.country} onChange={handleProfileChange} className="w-full !pl-8 !pr-3 !py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:bg-white focus:ring-2 ring-indigo-500/20 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pincode</label>
                    <div className="relative">
                      <FaAddressCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12}/>
                      <input name="pincode" value={profileForm.pincode} onChange={handleProfileChange} className="w-full !pl-8 !pr-3 !py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:bg-white focus:ring-2 ring-indigo-500/20 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button type="button" onClick={loadData} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving} className="px-8 py-2.5 rounded-xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2">
                    {saving ? <FaSync className="animate-spin" /> : <FaSave />} Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Account Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Username</p>
                    <p className="text-sm font-bold text-slate-800">{profileForm.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Created On</p>
                    <p className="text-sm font-bold text-slate-800">{new Date(createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Login IP</p>
                    <p className="text-sm font-bold text-slate-800 font-mono">{profileForm.lastLoginIp}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Security Settings</h2>
                
                <form onSubmit={saveSecurity} className="space-y-6">
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><FaLock className="text-indigo-600"/> Change Password</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                        <input type="password" placeholder="••••••••" value={securityForm.password} onChange={(e) => setSecurityForm({...securityForm, password: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 ring-indigo-500/20 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                        <input type="password" placeholder="••••••••" value={securityForm.confirmPassword} onChange={(e) => setSecurityForm({...securityForm, confirmPassword: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 ring-indigo-500/20 outline-none" />
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Password must be 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.</p>
                  </div>

                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><FaShieldAlt className="text-indigo-600"/> Two-Factor Authentication</h3>
                      <p className="text-xs font-bold text-slate-500 mt-1">Add an extra layer of security to your account.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={securityForm.twoFactorEnabled} onChange={(e) => setSecurityForm({...securityForm, twoFactorEnabled: e.target.checked})} />
                      <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" disabled={saving} className="px-8 py-2.5 rounded-xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2">
                      {saving ? <FaSync className="animate-spin" /> : <FaSave />} Update Security
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 sm:p-8 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-rose-800">Active Sessions</h3>
                  <p className="text-xs font-bold text-rose-600/70 mt-1">Logout from all other active devices and sessions.</p>
                </div>
                <button onClick={() => toast.success("Successfully logged out from all other devices")} className="px-5 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                  Logout All Devices
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-black text-slate-800 border-b border-slate-100 pb-4 mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: "orderNotifications", label: "Order Notifications", desc: "Receive alerts for new and updated orders." },
                  { key: "paymentNotifications", label: "Payment Notifications", desc: "Receive alerts for successful or failed payments." },
                  { key: "returnRequests", label: "Return Request Notifications", desc: "Receive alerts when a user requests a return." },
                  { key: "lowStockAlerts", label: "Low Stock Alerts", desc: "Receive alerts when product stock falls below threshold." },
                  { key: "supplierNotifications", label: "Supplier Notifications", desc: "Receive alerts regarding supplier updates." },
                  { key: "systemAnnouncements", label: "System Announcements", desc: "Receive critical system and platform updates." },
                  { key: "emailNotifications", label: "Email Notifications", desc: "Receive a daily digest via email." }
                ].map((item) => (
                  <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-2xl gap-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{item.label}</h4>
                      <p className="text-xs font-bold text-slate-500 mt-1">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="sr-only peer" checked={notifications[item.key]} onChange={() => toggleNotification(item.key)} />
                      <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 shadow-inner"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}



        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
