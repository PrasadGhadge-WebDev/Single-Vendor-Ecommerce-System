import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEdit, FaTrash, FaBox, FaLayerGroup, FaChartLine, FaCheckCircle, FaTimesCircle, FaGlobe, FaTags } from "react-icons/fa";
import { toast } from "react-toastify";
import API, { getImageUrl } from "../../api";

const CategoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/categories/${id}`);
      setCategory(data);
    } catch (err) {
      toast.error("Failed to load category details");
      navigate("/admin/categories");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading category details...</div>;
  if (!category) return <div className="p-8 text-center text-red-500">Category not found</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/admin/categories")} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
          <FaArrowLeft className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            {category.name}
            {category.status === 'active' ? (
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-green-100 text-green-700 rounded-md">Active</span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-red-100 text-red-700 rounded-md">Inactive</span>
            )}
            {category.featured && (
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-yellow-100 text-yellow-700 rounded-md border border-yellow-200">Featured</span>
            )}
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">/{category.slug || category.name.toLowerCase().replace(/\s+/g, '-')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-max">
        {['overview', 'subcategories', 'products', 'seo', 'hierarchy'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl"><FaBox /></div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Products</p>
                <p className="text-2xl font-black text-gray-900">{category.productCount || 0}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl"><FaLayerGroup /></div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Subcategories</p>
                <p className="text-2xl font-black text-gray-900">{category.childCategories?.length || 0}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-xl"><FaChartLine /></div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Est. Revenue</p>
                <p className="text-2xl font-black text-gray-900">₹0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4">Category Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Description</p>
                <p className="text-sm font-medium text-gray-700">{category.description || "No description provided."}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Parent Category</p>
                {category.parentCategory ? (
                  <p className="text-sm font-bold text-indigo-600">{category.parentCategory.name}</p>
                ) : (
                  <p className="text-sm font-medium text-gray-500">None (Top-Level Category)</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subcategories' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Subcategories</h2>
            <button onClick={() => navigate(`/admin/categories?modal=category&parent=${category._id}`)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100">
              + Add Subcategory
            </button>
          </div>
          {category.childCategories?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.childCategories.map(sub => (
                <div key={sub._id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {sub.image ? <img src={getImageUrl(sub.image)} className="w-full h-full object-cover" /> : <FaLayerGroup className="text-gray-300" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">{sub.name}</h3>
                      <p className="text-xs font-medium text-gray-500">/{sub.slug || sub.name}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/admin/categories/${sub._id}`)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">View</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <FaLayerGroup className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No subcategories found.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden p-6">
           <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Products Assigned to {category.name}</h2>
            <button onClick={() => navigate(`/admin/products?category=${category.name}`)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100">
              Manage Products
            </button>
          </div>
          {category.products?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                    <th className="py-3 px-4 font-semibold rounded-tl-lg">Product</th>
                    <th className="py-3 px-4 font-semibold">SKU</th>
                    <th className="py-3 px-4 font-semibold text-right">Price</th>
                    <th className="py-3 px-4 font-semibold text-center">Stock</th>
                    <th className="py-3 px-4 font-semibold text-center rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {category.products.map(product => (
                    <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" /> : <FaBox className="text-gray-300 w-full h-full p-2" />}
                          </div>
                          <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{product.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 font-mono">{product.sku || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm font-bold text-gray-900 text-right">₹{product.price}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <FaBox className="mx-auto text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No products assigned to this category.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><FaGlobe className="text-blue-500" /> Search Engine Optimization</h2>
          {category.seo ? (
            <div className="space-y-6 max-w-3xl">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meta Title</p>
                <p className="text-sm font-bold text-gray-900">{category.seo.metaTitle || "Not set"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Meta Description</p>
                <p className="text-sm font-medium text-gray-700">{category.seo.metaDescription || "Not set"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Keywords</p>
                <div className="flex gap-2 mt-2">
                  {category.seo.metaKeywords ? category.seo.metaKeywords.split(',').map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs font-bold text-gray-600">{kw.trim()}</span>
                  )) : <span className="text-sm text-gray-500">Not set</span>}
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No SEO data configured for this category.</p>
             </div>
          )}
        </div>
      )}

      {activeTab === 'hierarchy' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-6">Category Tree</h2>
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 font-mono text-sm">
            {category.parentCategory ? (
              <div className="mb-2 text-gray-500">
                <FaLayerGroup className="inline mr-2" /> {category.parentCategory.name}
              </div>
            ) : null}
            <div className="pl-4 font-bold text-indigo-600 border-l-2 border-indigo-200 ml-2">
              └── {category.name}
              {category.childCategories?.map(sub => (
                <div key={sub._id} className="pl-6 mt-2 text-gray-700 font-normal">
                  ├── {sub.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDetails;
