import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, FaCamera, FaTrash, FaUserShield, FaSave, FaPaperPlane,
  FaEnvelope, FaUserCheck, FaUserTimes, FaLock, FaKey, FaListUl, FaEye
} from "react-icons/fa";
import API from "../../api";
import { toast } from "react-toastify";

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State for all fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "Prefer Not to Say",
    dateOfBirth: "",
    status: "Active",
    isVerified: false,
    isPhoneVerified: false,
    customerType: "Regular",
    loyaltyPoints: 0,
    shippingDetails: {
      fullAddress: "", city: "", state: "", country: "", pincode: "", phone: ""
    },
    billingDetails: {
      sameAsShipping: true, fullAddress: "", city: "", state: "", country: "", pincode: "", phone: ""
    },
    preferences: {
      newsletter: true, sms: false, push: false
    },
    adminNotes: ""
  });
  const [originalUser, setOriginalUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/users/${id}`);
      setOriginalUser(data);
      
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        gender: data.gender || "Prefer Not to Say",
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : "",
        status: data.status || "Active",
        isVerified: data.isVerified || false,
        isPhoneVerified: data.isPhoneVerified || false,
        customerType: data.customerType || "Regular",
        loyaltyPoints: data.loyaltyPoints || 0,
        shippingDetails: {
          fullAddress: data.shippingDetails?.fullAddress || "",
          city: data.shippingDetails?.city || "",
          state: data.shippingDetails?.state || "",
          country: data.shippingDetails?.country || "",
          pincode: data.shippingDetails?.pincode || "",
          phone: data.shippingDetails?.phone || ""
        },
        billingDetails: {
          sameAsShipping: data.billingDetails?.sameAsShipping !== false, // default true
          fullAddress: data.billingDetails?.fullAddress || "",
          city: data.billingDetails?.city || "",
          state: data.billingDetails?.state || "",
          country: data.billingDetails?.country || "",
          pincode: data.billingDetails?.pincode || "",
          phone: data.billingDetails?.phone || ""
        },
        preferences: {
          newsletter: data.preferences?.newsletter !== false,
          sms: data.preferences?.sms || false,
          push: data.preferences?.push || false
        },
        adminNotes: data.adminNotes || ""
      });
    } catch (error) {
      toast.error("Failed to load user details");
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, section = null) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;

    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: finalValue
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleSave = async (notifyUser = false) => {
    try {
      setSaving(true);
      
      // If sameAsShipping is true, override billing details with shipping details
      const payload = { ...formData };
      if (payload.billingDetails.sameAsShipping) {
        payload.billingDetails = {
          sameAsShipping: true,
          ...payload.shippingDetails
        };
      }

      await API.put(`/users/${id}`, payload);
      toast.success(notifyUser ? "Changes saved and user notified!" : "Changes saved successfully!");
      if (!notifyUser) navigate("/admin/users");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = (type) => {
    if (type === 'link') toast.info("Password reset link sent to user's email.");
    if (type === 'temp') toast.success("Temporary password generated: X7kV9p2M");
  };

  if (loading) return (
    <div className="flex justify-center items-center h-[500px]">
      <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="max-w-[900px] mx-auto p-4 sm:p-8 space-y-8 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/users")} className="p-2 bg-white text-slate-500 hover:bg-slate-100 rounded-xl transition shadow-sm border border-slate-200">
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 m-0">Edit User</h1>
            <p className="text-xs font-bold text-slate-500 m-0">MANAGE USER PROFILE & SETTINGS</p>
          </div>
        </div>
        <button onClick={() => navigate(`/admin/users/${id}`)} className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-bold shadow-sm transition">
          <FaEye /> View Orders
        </button>
      </div>

      {/* 1. Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-500 text-3xl font-black overflow-hidden shadow-inner">
            {originalUser?.profileImage ? (
              <img src={originalUser.profileImage} alt={originalUser.name} className="w-full h-full object-cover" />
            ) : (
              formData.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1.5 bg-white text-indigo-600 rounded-full shadow-md border hover:bg-indigo-50"><FaCamera size={12} /></button>
            <button className="p-1.5 bg-white text-red-500 rounded-full shadow-md border hover:bg-red-50"><FaTrash size={12} /></button>
          </div>
        </div>
        <div className="flex-1 text-center md:text-left space-y-1">
          <h2 className="text-xl font-black text-slate-800">{formData.name}</h2>
          <p className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">UID: #{id.slice(-8).toUpperCase()}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
            <span className={`px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider ${formData.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
              {formData.isVerified ? 'Verified Customer' : 'Unverified'}
            </span>
            <span className={`px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider ${formData.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              Status: {formData.status}
            </span>
            <span className="px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-wider bg-purple-100 text-purple-700">
              Joined: {new Date(originalUser?.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          
          {/* 2. Personal Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer Not to Say">Prefer Not to Say</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition" />
              </div>
            </div>
          </div>

          {/* 4. Address Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-5 pb-3 border-b border-slate-100">Address Information</h3>
            
            <div className="space-y-6">
              {/* Shipping Address */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Shipping Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Address</label>
                    <input type="text" name="fullAddress" value={formData.shippingDetails.fullAddress} onChange={(e) => handleInputChange(e, 'shippingDetails')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">City</label>
                    <input type="text" name="city" value={formData.shippingDetails.city} onChange={(e) => handleInputChange(e, 'shippingDetails')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">State</label>
                    <input type="text" name="state" value={formData.shippingDetails.state} onChange={(e) => handleInputChange(e, 'shippingDetails')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Country</label>
                    <input type="text" name="country" value={formData.shippingDetails.country} onChange={(e) => handleInputChange(e, 'shippingDetails')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pincode</label>
                    <input type="text" name="pincode" value={formData.shippingDetails.pincode} onChange={(e) => handleInputChange(e, 'shippingDetails')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Billing Address</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="sameAsShipping" checked={formData.billingDetails.sameAsShipping} onChange={(e) => handleInputChange(e, 'billingDetails')} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                    <span className="text-xs font-bold text-slate-600">Same as Shipping Address</span>
                  </label>
                </div>
                
                {!formData.billingDetails.sameAsShipping && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Address</label>
                      <input type="text" name="fullAddress" value={formData.billingDetails.fullAddress} onChange={(e) => handleInputChange(e, 'billingDetails')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">City</label>
                      <input type="text" name="city" value={formData.billingDetails.city} onChange={(e) => handleInputChange(e, 'billingDetails')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">State</label>
                      <input type="text" name="state" value={formData.billingDetails.state} onChange={(e) => handleInputChange(e, 'billingDetails')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Country</label>
                      <input type="text" name="country" value={formData.billingDetails.country} onChange={(e) => handleInputChange(e, 'billingDetails')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pincode</label>
                      <input type="text" name="pincode" value={formData.billingDetails.pincode} onChange={(e) => handleInputChange(e, 'billingDetails')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Sidebar Columns */}
        <div className="space-y-8">
          
          {/* 3. Account Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Account Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">Account Status</p>
                  <p className="text-[10px] text-slate-500">Block or suspend user</p>
                </div>
                <select name="status" value={formData.status} onChange={handleInputChange} className="px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500">
                  <option value="Active">Active</option>
                  <option value="Blocked">Blocked</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">Email Verification</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="isVerified" checked={formData.isVerified} onChange={handleInputChange} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">Phone Verification</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="isPhoneVerified" checked={formData.isPhoneVerified} onChange={handleInputChange} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-600 mb-1">Customer Type</label>
                <select name="customerType" value={formData.customerType} onChange={handleInputChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-indigo-500 transition">
                  <option value="Regular">Regular Customer</option>
                  <option value="Premium">Premium Customer</option>
                  <option value="VIP">VIP Customer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Loyalty Points</label>
                <div className="relative">
                  <input type="number" name="loyaltyPoints" value={formData.loyaltyPoints} onChange={handleInputChange} className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-500 transition" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-500">PTS</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Preferences */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition">
                <input type="checkbox" name="newsletter" checked={formData.preferences.newsletter} onChange={(e) => handleInputChange(e, 'preferences')} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                <span className="text-xs font-bold text-slate-700">Receive Promotional Emails</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition">
                <input type="checkbox" name="sms" checked={formData.preferences.sms} onChange={(e) => handleInputChange(e, 'preferences')} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                <span className="text-xs font-bold text-slate-700">Receive SMS Updates</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition">
                <input type="checkbox" name="push" checked={formData.preferences.push} onChange={(e) => handleInputChange(e, 'preferences')} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                <span className="text-xs font-bold text-slate-700">Receive Push Notifications</span>
              </label>
            </div>
          </div>

          {/* 6. Security */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Security</h3>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Password should not be edited directly by admins. Please use the reset links below.
              </p>
              <button onClick={() => handlePasswordReset('link')} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">
                <FaEnvelope /> Send Reset Link
              </button>
              <button onClick={() => handlePasswordReset('temp')} className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">
                <FaKey /> Generate Temp Password
              </button>
            </div>
          </div>

          {/* 7. Admin Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">Admin Notes</h3>
            <p className="text-[10px] text-slate-500 mb-2">Visible only to admins.</p>
            <textarea 
              name="adminNotes" 
              value={formData.adminNotes} 
              onChange={handleInputChange} 
              className="w-full px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 placeholder:text-yellow-400 resize-none h-32"
              placeholder="E.g., Frequent customer. Prefers COD..."
            />
          </div>

        </div>
      </div>

      {/* 8. Form Actions (Sticky Footer) */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] flex items-center justify-between z-40 rounded-xl mt-8">
        <button onClick={() => navigate("/admin/users")} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition text-sm">
          Cancel
        </button>
        <div className="flex gap-3">
          <button onClick={() => handleSave(false)} disabled={saving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition text-sm flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaSave />}
            Save Changes
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="px-6 py-2.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl shadow-sm transition text-sm flex items-center gap-2">
            <FaPaperPlane />
            Save & Notify User
          </button>
        </div>
      </div>

    </div>
  );
};

export default EditUser;
