import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, FaEdit, FaTrash, FaShoppingCart, FaCreditCard, 
  FaRegHeart, FaStar, FaHistory, FaStickyNote, FaUserCircle,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaCheckCircle, FaBan,
  FaFileInvoiceDollar, FaCalendarAlt, FaShoppingBag
} from "react-icons/fa";
import API, { getImageUrl } from "../../api";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/ConfirmModal";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false });

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/users/${id}`);
      setUser(data);
    } catch (err) {
      toast.error("Error fetching user details");
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const handleDelete = () => {
    setConfirmConfig({
      isOpen: true,
      type: "danger",
      title: "Delete User?",
      message: "This action cannot be undone. All customer-related information may be permanently removed.",
      onConfirm: async () => {
        try {
          await API.delete(`/users/${id}`);
          toast.success("User deleted successfully");
          navigate("/admin/users");
        } catch (err) {
          toast.error("Failed to delete user");
        }
      }
    });
  };

  const handleToggleBlock = () => {
    const isBlocked = user?.isBlocked || user?.status === "Blocked";
    setConfirmConfig({
      isOpen: true,
      type: isBlocked ? "info" : "warning",
      title: isBlocked ? "Unblock User?" : "Block User?",
      message: isBlocked ? "Are you sure you want to unblock this user?" : "Are you sure you want to block this user?",
      onConfirm: async () => {
        try {
          await API.patch(`/users/${id}/block`, { isBlocked: !isBlocked });
          toast.success(`User ${isBlocked ? "unblocked" : "blocked"} successfully`);
          fetchUserDetails();
        } catch (err) {
          toast.error("Failed to change user status");
        }
      }
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!user) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: FaUserCircle },
    { id: "orders", label: "Orders", icon: FaShoppingCart },
    { id: "addresses", label: "Addresses", icon: FaMapMarkerAlt },
    { id: "wishlist", label: "Wishlist", icon: FaRegHeart },
    { id: "cart", label: "Cart Items", icon: FaShoppingBag },
    { id: "reviews", label: "Reviews", icon: FaStar },
    { id: "activity", label: "Activity Logs", icon: FaHistory },
  ];

  return (
    <div className="space-y-6">
      <ConfirmModal config={confirmConfig} setConfig={setConfirmConfig} />
      
      {/* Header Profile Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border p-6 sm:p-8" style={{ borderColor: 'var(--border-color)' }}>
        <button 
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 mb-6 transition-colors"
        >
          <FaArrowLeft /> Back to Users
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl sm:text-5xl font-black shadow-lg shadow-indigo-500/30 flex-shrink-0 relative group">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              user.name.charAt(0)
            )}
            <div className={`absolute bottom-0 right-2 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 ${user.status === 'Active' && !user.isBlocked ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black" style={{ color: 'var(--page-text)' }}>{user.name}</h1>
                <p className="text-sm font-bold opacity-50 mt-1 flex items-center gap-2">
                  <FaEnvelope /> {user.email}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-lg border ${
                    user.customerType === 'VIP' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                    user.customerType === 'Premium' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 
                    'bg-slate-500/10 text-slate-600 border-slate-500/20'
                  }`}>
                    {user.customerType || 'Regular'}
                  </span>
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-lg border ${
                    user.isVerified ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                  }`}>
                    {user.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                  <span className={`px-3 py-1 text-xs font-bold uppercase rounded-lg border ${
                    user.status === 'Active' && !user.isBlocked ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  }`}>
                    {user.isBlocked ? 'Blocked' : user.status || 'Active'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handleToggleBlock} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${
                  user.isBlocked ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}>
                  {user.isBlocked ? <><FaCheckCircle /> Unblock</> : <><FaBan /> Block</>}
                </button>
                <button onClick={handleDelete} className="px-4 py-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-xl font-bold text-sm hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-2">
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border shadow-sm p-4 sticky top-6 overflow-x-auto lg:overflow-visible flex lg:flex-col gap-2" style={{ borderColor: 'var(--border-color)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border shadow-sm p-6" style={{ borderColor: 'var(--border-color)' }}>
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <FaUserCircle className="text-indigo-500" />
                  User Overview
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Orders</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{user.stats?.ordersCount || 0}</p>
                  </div>
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2">Total Spending</p>
                    <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">₹{(user.stats?.totalSpent || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Avg Order Value</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">₹{Math.round(user.stats?.avgOrderValue || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-pink-50 dark:bg-pink-500/10 rounded-2xl border border-pink-100 dark:border-pink-500/20">
                    <p className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-2">Wishlist Items</p>
                    <p className="text-2xl font-black text-pink-700 dark:text-pink-400">{user.stats?.wishlistCount || 0}</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Cart Items</p>
                    <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{user.stats?.cartCount || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center shrink-0">
                        <FaPhone />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Phone Number</p>
                        <p className="font-bold text-slate-700 dark:text-slate-300">{user.phone || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center shrink-0">
                        <FaCalendarAlt />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Registration Date</p>
                        <p className="font-bold text-slate-700 dark:text-slate-300">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center shrink-0">
                        <FaUserCircle />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Gender</p>
                        <p className="font-bold text-slate-700 dark:text-slate-300">{user.gender || "Prefer Not to Say"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 flex items-center justify-center shrink-0">
                        <FaCalendarAlt />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Date of Birth</p>
                        <p className="font-bold text-slate-700 dark:text-slate-300">{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <FaShoppingCart className="text-indigo-500" />
                  Order History
                </h3>
                
                {user.orders?.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Order ID</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Date</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Amount</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {user.orders.map(order => (
                          <tr key={order._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-4 text-xs font-bold font-mono text-slate-600 dark:text-slate-300">#{order._id.slice(-6).toUpperCase()}</td>
                            <td className="p-4 text-xs font-bold text-slate-600 dark:text-slate-300">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="p-4 text-xs font-black text-indigo-600">₹{order.totalAmount?.toLocaleString()}</td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-bold uppercase">
                                {order.orderStatus}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => navigate(`/admin/orders/${order._id}`)}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-end gap-1 ml-auto"
                              >
                                View <FaArrowLeft className="rotate-180" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <FaShoppingCart className="mx-auto text-4xl text-slate-300 mb-4" />
                    <h4 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-1">No Orders Yet</h4>
                    <p className="text-sm font-medium text-slate-400">This customer hasn't placed any orders.</p>
                  </div>
                )}
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (() => {
              const latestOrderWithAddress = user.orders?.find(o => o.shippingAddress && o.shippingAddress.addressLine1);
              const dynamicAddress = latestOrderWithAddress ? 
                `${latestOrderWithAddress.shippingAddress.fullName}\n${latestOrderWithAddress.shippingAddress.addressLine1}${latestOrderWithAddress.shippingAddress.addressLine2 ? ', ' + latestOrderWithAddress.shippingAddress.addressLine2 : ''}\n${latestOrderWithAddress.shippingAddress.city}, ${latestOrderWithAddress.shippingAddress.state} ${latestOrderWithAddress.shippingAddress.pincode}\n${latestOrderWithAddress.shippingAddress.country}\nPhone: ${latestOrderWithAddress.shippingAddress.phone}`
                : null;
              
              const displayAddress = user.address || dynamicAddress;

              return (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <FaMapMarkerAlt className="text-indigo-500" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                    <div className="flex items-center gap-3 mb-4">
                      <FaMapMarkerAlt className="text-indigo-500 text-xl" />
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">Default Shipping Address</h4>
                    </div>
                    {displayAddress ? (
                      <div>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed whitespace-pre-wrap">{displayAddress}</p>
                        {!user.address && dynamicAddress && (
                          <span className="inline-block mt-3 px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded uppercase tracking-wider">
                            Derived from latest order
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm italic text-slate-400">No shipping address provided.</p>
                    )}
                  </div>

                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                    <div className="flex items-center gap-3 mb-4">
                      <FaCreditCard className="text-purple-500 text-xl" />
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">Billing Address</h4>
                    </div>
                    {user.billingAddress ? (
                      <p className="text-sm font-medium text-slate-500 leading-relaxed whitespace-pre-wrap">{user.billingAddress}</p>
                    ) : (
                      <p className="text-sm italic text-slate-400">Same as shipping address or not provided.</p>
                    )}
                  </div>
                </div>
              </div>
            )})()}

            {/* WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <FaRegHeart className="text-pink-500" />
                  Wishlist
                </h3>
                
                {user.wishlist?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {user.wishlist.filter(Boolean).map(product => (
                      <div key={product._id} onClick={() => navigate(`/product/${product._id}`)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm flex flex-col group cursor-pointer hover:shadow-md transition-shadow">
                        <div className="h-48 bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
                          {product.image ? (
                            <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><FaRegHeart size={32} /></div>
                          )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">{product.category || 'Uncategorized'}</p>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-2 mb-2 flex-1">{product.name}</h4>
                          <p className="font-black text-slate-900 dark:text-slate-50 text-lg">₹{(product.discountPrice || product.price || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <FaRegHeart className="mx-auto text-5xl text-pink-200 dark:text-pink-900 mb-4" />
                    <h4 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-1">Wishlist Empty</h4>
                    <p className="text-sm font-medium text-slate-400">This customer has no items in their wishlist.</p>
                  </div>
                )}
              </div>
            )}

            {/* CART ITEMS TAB */}
            {activeTab === 'cart' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <FaShoppingBag className="text-amber-500" />
                  Cart Items
                </h3>
                
                {user.cartItems?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {user.cartItems.filter(item => item.productId).map(item => {
                      const product = item.productId;
                      return (
                      <div key={item._id} onClick={() => navigate(`/product/${product._id}`)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm flex flex-col group cursor-pointer hover:shadow-md transition-shadow">
                        <div className="h-48 bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
                          {product.image ? (
                            <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><FaShoppingBag size={32} /></div>
                          )}
                          <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur text-amber-600 dark:text-amber-400 text-xs font-black px-2 py-1 rounded-lg border border-white/20 shadow-sm">
                            Qty: {item.quantity}
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">{product.category || 'Uncategorized'}</p>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-2 mb-2 flex-1">{product.name}</h4>
                          <p className="font-black text-slate-900 dark:text-slate-50 text-lg">₹{(product.discountPrice || product.price || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    )})}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <FaShoppingBag className="mx-auto text-5xl text-amber-200 dark:text-amber-900 mb-4" />
                    <h4 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-1">Cart Empty</h4>
                    <p className="text-sm font-medium text-slate-400">This customer has no items in their cart.</p>
                  </div>
                )}
              </div>
            )}

            {/* REVIEWS TAB (MOCK) */}
            {activeTab === 'reviews' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <FaStar className="text-amber-500" />
                  Product Reviews
                </h3>
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <FaStar className="mx-auto text-5xl text-amber-200 dark:text-amber-900 mb-4" />
                  <h4 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-1">No Reviews</h4>
                  <p className="text-sm font-medium text-slate-400">Reviews feature is currently pending module integration.</p>
                </div>
              </div>
            )}

            {/* ACTIVITY LOGS TAB (MOCK) */}
            {activeTab === 'activity' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-800 dark:text-slate-100">
                  <FaHistory className="text-blue-500" />
                  Activity Timeline
                </h3>
                <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-100 dark:border-indigo-900/50 space-y-8 py-4">
                  
                  <div className="relative">
                    <div className="absolute -left-[35px] sm:-left-[43px] w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center border-[4px] border-white dark:border-slate-900 shadow-sm">
                      <FaUserCircle size={10} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-1">{new Date(user.createdAt).toLocaleString()}</p>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">Account Created</h4>
                      <p className="text-sm text-slate-500 mt-1">User registered on the platform.</p>
                    </div>
                  </div>

                  {user.orders?.map(order => (
                    <div className="relative" key={order._id}>
                      <div className="absolute -left-[35px] sm:-left-[43px] w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-[4px] border-white dark:border-slate-900 shadow-sm">
                        <FaShoppingCart size={10} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-1">{new Date(order.createdAt).toLocaleString()}</p>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">Order Placed</h4>
                        <p className="text-sm text-slate-500 mt-1">Order #{order._id.slice(-6).toUpperCase()} was placed successfully.</p>
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            )}



          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
