export const inDateRange = (value, from, to) => {
  if (!value) return false;
  const current = new Date(value);
  if (Number.isNaN(current.getTime())) return false;

  if (from) {
    const start = new Date(from);
    if (!Number.isNaN(start.getTime()) && current < start) return false;
  }
  if (to) {
    const end = new Date(to);
    if (!Number.isNaN(end.getTime()) && current > end) return false;
  }

  return true;
};

export const toCsvValue = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

export const downloadCsv = (filename, rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(toCsvValue).join(","),
    ...rows.map((row) => headers.map((key) => toCsvValue(row[key])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
