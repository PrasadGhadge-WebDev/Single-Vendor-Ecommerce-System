import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaSpinner, FaCheckCircle, FaTimes } from "react-icons/fa";

const INDIAN_BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "IndusInd Bank",
  "Yes Bank",
  "IDFC FIRST Bank",
  "Central Bank of India",
  "Indian Bank",
  "Other"
];

const SupplierFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    mobileNumber: "",
    email: "",
    gstNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    company: "",
    website: "",
    notes: "",
    isActive: true,
    bankDetails: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      ifscCode: ""
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          contactPerson: initialData.contactPerson || "",
          mobileNumber: initialData.mobileNumber || initialData.phone || "",
          email: initialData.email || "",
          gstNumber: initialData.gstNumber || "",
          address: initialData.address || "",
          city: initialData.city || "",
          state: initialData.state || "",
          pincode: initialData.pincode || "",
          country: initialData.country || "India",
          company: initialData.company || "",
          website: initialData.website || "",
          notes: initialData.notes || "",
          isActive: initialData.isActive ?? true,
          bankDetails: {
            bankName: initialData.bankDetails?.bankName || "",
            accountName: initialData.bankDetails?.accountName || "",
            accountNumber: initialData.bankDetails?.accountNumber || "",
            ifscCode: initialData.bankDetails?.ifscCode || ""
          }
        });
      } else {
        setFormData({
          name: "",
          contactPerson: "",
          mobileNumber: "",
          email: "",
          gstNumber: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
          company: "",
          website: "",
          notes: "",
          isActive: true,
          bankDetails: {
            bankName: "",
            accountName: "",
            accountNumber: "",
            ifscCode: ""
          }
        });
      }
    }
  }, [initialData, isOpen]);

  // Auto-fetch City and State based on Pincode
  useEffect(() => {
    const fetchLocation = async () => {
      if (formData.pincode && formData.pincode.length === 6 && /^\d{6}$/.test(formData.pincode)) {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const postOffice = data[0].PostOffice[0];
            setFormData(prev => ({
              ...prev,
              city: postOffice.District || prev.city,
              state: postOffice.State || prev.state,
              country: "India"
            }));
            setErrors(prev => {
              const newErrs = { ...prev };
              delete newErrs.city;
              delete newErrs.state;
              return newErrs;
            });
          }
        } catch (error) {
          console.error("Error fetching pincode data:", error);
        }
      }
    };
    
    const timeoutId = setTimeout(() => {
      fetchLocation();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [formData.pincode]);

  const getInputClass = (fieldName) => `w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all text-sm font-medium text-slate-700 ${errors[fieldName] ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`;

  const validate = (dataToValidate = formData) => {
    const newErrors = {};
    const alphaSpaceRegex = /^[A-Za-z\s]+$/;

    // Supplier Name
    if (!dataToValidate.name) {
      newErrors.name = "Supplier name is required";
    } else if (dataToValidate.name.length < 3 || dataToValidate.name.length > 100 || !alphaSpaceRegex.test(dataToValidate.name)) {
      newErrors.name = "Supplier name should contain only alphabets and spaces.";
    }

    // Contact Person
    if (!dataToValidate.contactPerson) {
      newErrors.contactPerson = "Contact person is required";
    } else if (dataToValidate.contactPerson.length < 3 || dataToValidate.contactPerson.length > 50 || !alphaSpaceRegex.test(dataToValidate.contactPerson)) {
      newErrors.contactPerson = "Contact person name should contain only alphabets and spaces.";
    }

    // Mobile Number
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!dataToValidate.mobileNumber) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!mobileRegex.test(dataToValidate.mobileNumber)) {
      newErrors.mobileNumber = "Please enter a valid 10-digit mobile number.";
    }

    // Email Address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (dataToValidate.email && !emailRegex.test(dataToValidate.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // GST Number
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (dataToValidate.gstNumber && !gstRegex.test(dataToValidate.gstNumber)) {
      newErrors.gstNumber = "Please enter a valid GST number.";
    }

    // Address
    if (!dataToValidate.address) {
      newErrors.address = "Address is required";
    } else if (dataToValidate.address.length < 5 || dataToValidate.address.length > 255) {
      newErrors.address = "Please enter a valid address.";
    }

    // City
    if (!dataToValidate.city) {
      newErrors.city = "City is required";
    } else if (dataToValidate.city.length < 2 || dataToValidate.city.length > 50 || !alphaSpaceRegex.test(dataToValidate.city)) {
      newErrors.city = "City should contain only alphabets and spaces.";
    }

    // State
    if (!dataToValidate.state) {
      newErrors.state = "State is required";
    } else if (dataToValidate.state.length < 2 || dataToValidate.state.length > 50 || !alphaSpaceRegex.test(dataToValidate.state)) {
      newErrors.state = "State should contain only alphabets and spaces.";
    }

    // Pincode
    const pincodeRegex = /^\d{6}$/;
    if (!dataToValidate.pincode) {
      newErrors.pincode = "Pincode is required";
    } else if (!pincodeRegex.test(dataToValidate.pincode)) {
      newErrors.pincode = "Please enter a valid 6-digit pincode.";
    }

    // Website
    const urlRegex = /^(https?:\/\/)?([\w\d-]+\.)+[\w\d]{2,}(\/.*)?$/i;
    if (dataToValidate.website && !urlRegex.test(dataToValidate.website)) {
      newErrors.website = "Please enter a valid website URL.";
    }

    // Notes
    if (dataToValidate.notes && dataToValidate.notes.length > 500) {
      newErrors.notes = "Notes cannot exceed 500 characters.";
    }

    // Banking Information
    if (dataToValidate.bankDetails) {
      if (dataToValidate.bankDetails.bankName && (dataToValidate.bankDetails.bankName.length > 100 || !alphaSpaceRegex.test(dataToValidate.bankDetails.bankName))) {
        newErrors["bankDetails.bankName"] = "Bank name should contain only alphabets and spaces.";
      }
      if (dataToValidate.bankDetails.accountName && (dataToValidate.bankDetails.accountName.length > 100 || !alphaSpaceRegex.test(dataToValidate.bankDetails.accountName))) {
        newErrors["bankDetails.accountName"] = "Account holder name should contain only alphabets and spaces.";
      }
      const accountRegex = /^\d{9,18}$/;
      if (dataToValidate.bankDetails.accountNumber && !accountRegex.test(dataToValidate.bankDetails.accountNumber)) {
        newErrors["bankDetails.accountNumber"] = "Please enter a valid account number.";
      }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (dataToValidate.bankDetails.ifscCode && !ifscRegex.test(dataToValidate.bankDetails.ifscCode)) {
        newErrors["bankDetails.ifscCode"] = "Please enter a valid IFSC code.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === "checkbox" ? checked : value;
    
    // Quick sanitizations while typing
    if (name === "mobileNumber") {
      val = val.replace(/\D/g, '').slice(0, 10);
    } else if (name === "pincode") {
      val = val.replace(/\D/g, '').slice(0, 6);
    } else if (name === "gstNumber" || name === "bankDetails.ifscCode") {
      val = val.toUpperCase();
    }
    
    if (name.startsWith("bankDetails.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [field]: val
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Deep Sanitize before validate and save
    const sanitizedData = {
      ...formData,
      name: formData.name.replace(/\s+/g, ' ').trim(),
      contactPerson: formData.contactPerson.replace(/\s+/g, ' ').trim(),
      mobileNumber: formData.mobileNumber.replace(/\D/g, '').slice(0, 10),
      email: formData.email.trim().toLowerCase(),
      gstNumber: formData.gstNumber.trim().toUpperCase(),
      address: formData.address.replace(/\s+/g, ' ').trim(),
      city: formData.city.replace(/\s+/g, ' ').trim(),
      state: formData.state.replace(/\s+/g, ' ').trim(),
      pincode: formData.pincode.replace(/\D/g, '').slice(0, 6),
      company: formData.company.replace(/\s+/g, ' ').trim(),
      website: formData.website.trim(),
      notes: formData.notes.replace(/\s+/g, ' ').trim(),
      bankDetails: {
        bankName: formData.bankDetails.bankName.replace(/\s+/g, ' ').trim(),
        accountName: formData.bankDetails.accountName.replace(/\s+/g, ' ').trim(),
        accountNumber: formData.bankDetails.accountNumber.replace(/\D/g, '').trim(),
        ifscCode: formData.bankDetails.ifscCode.replace(/\s+/g, '').toUpperCase()
      }
    };
    
    setFormData(sanitizedData);
    
    if (validate(sanitizedData)) {
      onSave(sanitizedData);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* Modal Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100">
          <h1 className="text-xl font-black text-slate-900 m-0">
            {initialData ? "Refine Supplier Profile" : "New Supplier"}
          </h1>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
          <form id="supplierForm" onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- BASIC INFORMATION --- */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Supplier Name *</label>
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange} required
                    className={getInputClass("name")}
                    placeholder="Enter supplier name"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Contact Person *</label>
                  <input
                    type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required
                    className={getInputClass("contactPerson")}
                    placeholder="Enter contact person name"
                  />
                  {errors.contactPerson && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.contactPerson}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Mobile Number *</label>
                  <input
                    type="text" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required
                    className={getInputClass("mobileNumber")}
                    placeholder="Enter mobile number"
                  />
                  {errors.mobileNumber && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.mobileNumber}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Email Address</label>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    className={getInputClass("email")}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.email}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">GST Number</label>
                  <input
                    type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange}
                    className={getInputClass("gstNumber")}
                    placeholder="Enter GST number"
                  />
                  {errors.gstNumber && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.gstNumber}</p>}
                </div>
              </div>
            </div>

            {/* --- ADDRESS INFORMATION --- */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Address Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Address *</label>
                  <input
                    type="text" name="address" value={formData.address} onChange={handleChange} required
                    className={getInputClass("address")}
                    placeholder="Enter address"
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.address}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">City *</label>
                  <input
                    type="text" name="city" value={formData.city} onChange={handleChange} required
                    className={getInputClass("city")}
                    placeholder="Enter city"
                  />
                  {errors.city && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.city}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">State *</label>
                  <input
                    type="text" name="state" value={formData.state} onChange={handleChange} required
                    className={getInputClass("state")}
                    placeholder="Enter state"
                  />
                  {errors.state && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.state}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Pincode *</label>
                  <input
                    type="text" name="pincode" value={formData.pincode} onChange={handleChange} required
                    className={getInputClass("pincode")}
                    placeholder="Enter pincode"
                  />
                  {errors.pincode && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.pincode}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Country</label>
                  <input
                    type="text" name="country" value={formData.country} onChange={handleChange}
                    className={getInputClass("country")}
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>

            {/* --- BUSINESS INFORMATION --- */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Company Name</label>
                  <input
                    type="text" name="company" value={formData.company} onChange={handleChange}
                    className={getInputClass("company")}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Website</label>
                  <input
                    type="text" name="website" value={formData.website} onChange={handleChange}
                    className={getInputClass("website")}
                    placeholder="Enter website URL"
                  />
                  {errors.website && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.website}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Notes</label>
                  <textarea
                    name="notes" value={formData.notes} onChange={handleChange} rows="3"
                    className={`${getInputClass("notes")} resize-none`}
                    placeholder="Enter additional notes"
                  />
                  {errors.notes && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.notes}</p>}
                </div>
              </div>
            </div>

            {/* --- BANKING INFORMATION --- */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Banking Information (Optional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Bank Name</label>
                  <div className="relative">
                    <select
                      name="bankDetails.bankName" value={formData.bankDetails.bankName} onChange={handleChange}
                      className={`${getInputClass("bankDetails.bankName")} appearance-none`}
                    >
                      <option value="">Select Bank Name</option>
                      {INDIAN_BANKS.map((bank, idx) => (
                        <option key={idx} value={bank}>{bank}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  {errors["bankDetails.bankName"] && <p className="text-xs text-red-500 mt-1 font-semibold">{errors["bankDetails.bankName"]}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Account Holder Name</label>
                  <input
                    type="text" name="bankDetails.accountName" value={formData.bankDetails.accountName} onChange={handleChange}
                    className={getInputClass("bankDetails.accountName")}
                    placeholder="Enter account holder name"
                  />
                  {errors["bankDetails.accountName"] && <p className="text-xs text-red-500 mt-1 font-semibold">{errors["bankDetails.accountName"]}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Account Number</label>
                  <input
                    type="text" name="bankDetails.accountNumber" value={formData.bankDetails.accountNumber} onChange={handleChange}
                    className={getInputClass("bankDetails.accountNumber")}
                    placeholder="Enter account number"
                  />
                  {errors["bankDetails.accountNumber"] && <p className="text-xs text-red-500 mt-1 font-semibold">{errors["bankDetails.accountNumber"]}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">IFSC Code</label>
                  <input
                    type="text" name="bankDetails.ifscCode" value={formData.bankDetails.ifscCode} onChange={handleChange}
                    className={getInputClass("bankDetails.ifscCode")}
                    placeholder="Enter IFSC code"
                  />
                  {errors["bankDetails.ifscCode"] && <p className="text-xs text-red-500 mt-1 font-semibold">{errors["bankDetails.ifscCode"]}</p>}
                </div>
              </div>
            </div>

            {/* --- ACCOUNT STATUS --- */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Account Status</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-6 rounded-2xl border border-slate-200 bg-white">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Account Status</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">Enable to mark this supplier as active</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-8 py-5 border-t border-slate-100 bg-slate-50/50">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-8 py-3 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 uppercase tracking-wider hover:bg-slate-50 transition-all"
          >
            CANCEL
          </button>
          
          <button 
            form="supplierForm"
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl text-xs font-bold bg-blue-600 text-white uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all disabled:opacity-70"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle size={14} />}
            {initialData ? "UPDATE SUPPLIER" : "SAVE SUPPLIER"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default SupplierFormModal;
