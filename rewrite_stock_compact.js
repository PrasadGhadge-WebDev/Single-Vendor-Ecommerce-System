const fs = require('fs');

let content = fs.readFileSync('client/src/pages/Admin/StockHistory.jsx', 'utf8');

// Replace standard input/select classes to make them smaller (py-2, text-xs, rounded-lg)
content = content.replace(/py-2\.5/g, 'py-2');
content = content.replace(/rounded-xl/g, 'rounded-lg');
content = content.replace(/text-sm/g, 'text-xs');

// For the search container and input
content = content.replace(/min-w-\[280px\]/g, 'min-w-[220px]');
content = content.replace(/pl-4 pr-10/g, 'pl-3 pr-8');
content = content.replace(/right-3\.5/g, 'right-3');

// For the selects
content = content.replace(/min-w-\[160px\]/g, 'min-w-[140px]');
content = content.replace(/min-w-\[150px\]/g, 'min-w-[130px]');

fs.writeFileSync('client/src/pages/Admin/StockHistory.jsx', content);
console.log('StockHistory filter components made compact.');
