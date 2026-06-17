const fs = require('fs');

let content = fs.readFileSync('client/src/pages/Admin/StockHistory.jsx', 'utf8');

// 1. Add movementType state
content = content.replace(
  /const \[search, setSearch\] = useState\(""\);/s,
  'const [search, setSearch] = useState("");\n  const [movementType, setMovementType] = useState("");\n  const navigate = useNavigate();'
);

// 2. Add useNavigate import
if (!content.includes('useNavigate')) {
  content = content.replace(
    /import React, \{[^\}]+\} from "react";/s,
    match => match + '\nimport { useNavigate } from "react-router-dom";'
  );
}

// 3. Add productId, movementType to params
content = content.replace(
  /if \(search\.trim\(\)\) params\.search = search\.trim\(\);/,
  'if (search.trim()) params.search = search.trim();\n      if (movementType) params.movementType = movementType;'
);

content = content.replace(
  /\]\);/g, // for useCallback array dependencies
  match => match
).replace(
  /\[dateFrom, dateTo, eventType, productId, search\]\);/,
  '[dateFrom, dateTo, eventType, productId, search, movementType]);'
);

// 4. Update Reset Filters button
content = content.replace(
  /setSearch\(""\); setEventType\(""\); setDateFrom\(""\); setDateTo\(""\);/s,
  'setSearch(""); setEventType(""); setProductId(""); setMovementType(""); setDateFrom(""); setDateTo("");'
);
content = content.replace(
  /\(search \|\| eventType \|\| dateFrom \|\| dateTo\)/,
  '(search || eventType || productId || movementType || dateFrom || dateTo)'
);

// 5. Add Product Dropdown and Movement Dropdown to Advanced Filters
const filtersBlock = `<div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex-grow min-w-[200px] relative">
          <input
            type="text"
            placeholder="Search Product, SKU, Ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
          />
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        </div>

        <div className="relative min-w-[160px]">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none"
          >
            <option value="">All Products</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
        </div>

        <div className="relative min-w-[160px]">
          <select
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none"
          >
            <option value="">All Movements</option>
            <option value="INCREASED">Stock Increased (+)</option>
            <option value="REDUCED">Stock Reduced (-)</option>
          </select>
          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
        </div>
        
        <div className="relative min-w-[160px]">
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none"
          >
            <option value="">All Transactions</option>
            <option value="INITIAL_STOCK">Initial Stock</option>
            <option value="PURCHASE">Purchase</option>
            <option value="PURCHASE_UPDATE">Purchase Edit</option>
            <option value="SALE">Order</option>
            <option value="CANCELLATION_RESTOCK">Order Cancelled</option>
            <option value="RETURN">Return</option>
            <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
            <option value="PRODUCT_UPDATE">Product Update</option>
          </select>
          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
            title="From Date"
          />
          <span className="text-slate-400 font-bold">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
            title="To Date"
          />
        </div>

        {(search || eventType || productId || movementType || dateFrom || dateTo) && (
          <button 
            onClick={() => {
              setSearch(""); setEventType(""); setProductId(""); setMovementType(""); setDateFrom(""); setDateTo("");
              fetchHistory(true);
            }}
            className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors shrink-0"
          >
            Reset
          </button>
        )}
      </div>`;

content = content.replace(/<div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-wrap lg:flex-nowrap gap-4 items-center">[\s\S]*?<\/div>[\s]*?{\/\* Main Ledger Table \*\/}/, filtersBlock + '\n\n      {/* Main Ledger Table */}');

// 6. Add "View Related Record" Action
const newActions = `<button 
                                onClick={() => { setSelectedEntry(entry); setDetailsDrawerOpen(true); setOpenDropdownId(null); }} 
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2"
                              >
                                <FaEye size={12} /> View Details
                              </button>
                              <button 
                                onClick={() => { window.print(); setOpenDropdownId(null); }} 
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <FaPrint size={12} /> Print Entry
                              </button>
                              {entry.referenceType === 'PURCHASE' && (
                                <button 
                                  onClick={() => { navigate('/admin/purchases'); setOpenDropdownId(null); }} 
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                                >
                                  <FaBox size={12} /> View Related Purchase
                                </button>
                              )}
                              {entry.referenceType === 'SALE' && (
                                <button 
                                  onClick={() => { navigate('/admin/orders'); setOpenDropdownId(null); }} 
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                                >
                                  <FaBox size={12} /> View Related Order
                                </button>
                              )}
                              {entry.referenceType === 'PRODUCT' && (
                                <button 
                                  onClick={() => { navigate('/admin/products'); setOpenDropdownId(null); }} 
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                                >
                                  <FaBox size={12} /> View Related Product
                                </button>
                              )}`;

content = content.replace(/<button [\s\S]*?<FaEye size=\{12\} \/> View Details[\s\S]*?<\/button>[\s\S]*?<button [\s\S]*?<FaPrint size=\{12\} \/> Print Entry[\s\S]*?<\/button>/, newActions);

fs.writeFileSync('client/src/pages/Admin/StockHistory.jsx', content);
console.log('StockHistory MVP updated.');
