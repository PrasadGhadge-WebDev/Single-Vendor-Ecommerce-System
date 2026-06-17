const fs = require('fs');

let content = fs.readFileSync('client/src/pages/Admin/StockHistory.jsx', 'utf8');

// 1. Add dateRange state
content = content.replace(
  /const \[dateFrom, setDateFrom\] = useState\(""\);/,
  'const [dateRange, setDateRange] = useState("");\n  const [dateFrom, setDateFrom] = useState("");'
);

// 2. Update params logic in fetchHistory
const newParamsLogic = `      if (dateRange && dateRange !== 'CUSTOM') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        
        if (dateRange === 'TODAY') {
          params.dateFrom = today.toISOString();
          params.dateTo = end.toISOString();
        } else if (dateRange === 'LAST_7_DAYS') {
          const start = new Date(today);
          start.setDate(today.getDate() - 7);
          params.dateFrom = start.toISOString();
          params.dateTo = end.toISOString();
        } else if (dateRange === 'LAST_30_DAYS') {
          const start = new Date(today);
          start.setDate(today.getDate() - 30);
          params.dateFrom = start.toISOString();
          params.dateTo = end.toISOString();
        } else if (dateRange === 'THIS_MONTH') {
          const start = new Date(today.getFullYear(), today.getMonth(), 1);
          params.dateFrom = start.toISOString();
          params.dateTo = end.toISOString();
        }
      } else {
        if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
        if (dateTo) params.dateTo = new Date(dateTo).toISOString();
      }`;

content = content.replace(
  /if \(dateFrom\) params\.dateFrom = new Date\(dateFrom\)\.toISOString\(\);\n\s*if \(dateTo\) params\.dateTo = new Date\(dateTo\)\.toISOString\(\);/,
  newParamsLogic
);

// 3. Update fetchHistory dependencies
content = content.replace(
  /\[dateFrom, dateTo, eventType, productId, movementType, search\]/,
  '[dateRange, dateFrom, dateTo, eventType, productId, movementType, search]'
);

// 4. Update the reset filters button
content = content.replace(
  /setSearch\(""\); setEventType\(""\); setProductId\(""\); setMovementType\(""\); setDateFrom\(""\); setDateTo\(""\);/,
  'setSearch(""); setEventType(""); setProductId(""); setMovementType(""); setDateRange(""); setDateFrom(""); setDateTo("");'
);
content = content.replace(
  /\(search \|\| eventType \|\| productId \|\| movementType \|\| dateFrom \|\| dateTo\)/,
  '(search || eventType || productId || movementType || dateRange || dateFrom || dateTo)'
);

// 5. Replace the filters container class to not wrap and allow scroll
content = content.replace(
  /<div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">/,
  '<div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-x-auto custom-scrollbar gap-4 items-center pb-4">'
);

// 6. Update search input to shrink-0 and move icon to right
content = content.replace(
  /<div className="flex-grow min-w-\[200px\] relative">/,
  '<div className="flex-grow min-w-[250px] relative shrink-0">'
);
content = content.replace(
  /className="w-full pl-10 pr-4 py-2\.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 ring-indigo-500\/20 focus:border-indigo-500 transition-all outline-none"/,
  'className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"'
);
content = content.replace(
  /<FaSearch className="absolute left-3\.5 top-1\/2 -translate-y-1\/2 text-slate-400" size=\{14\} \/>/,
  '<FaSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />'
);

// 7. Add shrink-0 to other filter selects
content = content.replace(
  /className="relative min-w-\[160px\]"/g,
  'className="relative min-w-[160px] shrink-0"'
);

// 8. Replace date inputs with the new Date Range logic
const dateInputsBlock = `<div className="flex items-center gap-2">
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
        </div>`;

const newDateLogic = `<div className="relative min-w-[150px] shrink-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 ring-indigo-500/20 transition-all cursor-pointer outline-none appearance-none"
          >
            <option value="">All Time</option>
            <option value="TODAY">Today</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="CUSTOM">Custom Range</option>
          </select>
          <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
        </div>

        {dateRange === 'CUSTOM' && (
          <div className="flex items-center gap-2 shrink-0">
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
        )}`;

content = content.replace(dateInputsBlock, newDateLogic);

fs.writeFileSync('client/src/pages/Admin/StockHistory.jsx', content);
console.log('StockHistory updated for date range and single row filters.');
