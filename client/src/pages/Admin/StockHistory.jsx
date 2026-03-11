import React, { useEffect, useMemo, useRef, useState } from "react";
import API from "../../api";
import { toast } from "react-toastify";
import { downloadCsv } from "../../utils/adminHelpers";
import "./StockHistory.css";
import Pagination from "../../components/Pagination";

const HISTORY_PER_PAGE = 12;

const StockHistory = () => {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState("");
  const [productId, setProductId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const productSuggestionTimeout = useRef(null);
  const [importing, setImporting] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const fileInputRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get("/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (eventType) params.eventType = eventType;
      if (productId) params.productId = productId;
      if (search.trim()) params.search = search.trim();
      if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
      if (dateTo) params.dateTo = new Date(dateTo).toISOString();

      const { data } = await API.get("/stock-history", { params });
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load stock history");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchHistory();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [eventType, productId, dateFrom, dateTo]);

  const exportHistory = () => {
    if (!items.length) {
      toast.info("No stock history to export");
      return;
    }
    downloadCsv(
      "stock-history.csv",
      items.map((entry) => ({
        Date: entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "",
        Product: entry.product?.name || "",
        Event: entry.eventType,
        Change: entry.quantityChange,
        Previous: entry.previousStock,
        New: entry.newStock,
        Reference: entry.referenceType || "",
        ReferenceId: entry.referenceId || "",
        By: entry.actor?.name || "System",
        Note: entry.note || "",
      }))
    );
  };

  const parseCsvLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
        continue;
      }
      current += char;
    }

    result.push(current);
    return result;
  };

  const parseCsv = (text) => {
    const rows = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (rows.length <= 1) return [];

    const headers = parseCsvLine(rows[0]);
    return rows.slice(1).map((line) => {
      const values = parseCsvLine(line);
      return headers.reduce((acc, header, index) => {
        acc[header.trim()] = values[index] || "";
        return acc;
      }, {});
    });
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const parsedRows = parseCsv(text);
      if (parsedRows.length === 0) {
        toast.warning("No valid rows found in the CSV");
        return;
      }

      const mapped = parsedRows.map((row, index) => {
        const change = Number(row.Change || row.quantityChange || 0);
        const previous = Number(row.Previous || row.previousStock || 0);
        const future =
          Number(row.New || row.newStock || "") ||
          (Number.isFinite(change) && Number.isFinite(previous) ? previous + change : previous);

        return {
          _id: `import-${Date.now()}-${index}`,
          createdAt: row.Date ? new Date(row.Date).toISOString() : new Date().toISOString(),
          product: { name: row.Product || row.product || "Unknown" },
          eventType: row.Event || row.eventType || "MANUAL_ADJUSTMENT",
          quantityChange: change,
          previousStock: previous,
          newStock: future,
          referenceType: row.Reference || row.referenceType || "",
          referenceId: row.ReferenceId || row.referenceId || "",
          actor: { name: row.By || row.actor || "Imported" },
          note: row.Note || row.note || "",
        };
      });

      setItems((prev) => [...mapped, ...prev]);
      toast.success(`Imported ${mapped.length} history row(s)`);
    } catch (error) {
      console.error("Import failed", error);
      toast.error("Failed to parse import file");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const productSuggestions = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return [];
    return products.filter((product) => product.name?.toLowerCase().includes(term));
  }, [products, productSearch]);

  const handleProductSuggestionSelect = (product) => {
    setProductId(product._id);
    setProductSearch(product.name || "");
    setShowProductSuggestions(false);
  };

  const handleProductFocus = () => {
    if (productSuggestionTimeout.current) {
      clearTimeout(productSuggestionTimeout.current);
      productSuggestionTimeout.current = null;
    }
    setShowProductSuggestions(true);
  };

  const handleProductBlur = () => {
    productSuggestionTimeout.current = setTimeout(() => {
      setShowProductSuggestions(false);
      productSuggestionTimeout.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (productSuggestionTimeout.current) {
        clearTimeout(productSuggestionTimeout.current);
      }
    };
  }, []);

  const selectedProductName = products.find((product) => product._id === productId)?.name || "";

  useEffect(() => {
    setHistoryPage(1);
  }, [eventType, productId, dateFrom, dateTo, search]);

  const totalHistoryPages = Math.max(1, Math.ceil(items.length / HISTORY_PER_PAGE));

  useEffect(() => {
    if (historyPage > totalHistoryPages) {
      setHistoryPage(totalHistoryPages);
    }
  }, [historyPage, totalHistoryPages]);

  const paginatedHistory = useMemo(() => {
    const startIndex = (historyPage - 1) * HISTORY_PER_PAGE;
    return items.slice(startIndex, startIndex + HISTORY_PER_PAGE);
  }, [items, historyPage]);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Stock History</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={fetchHistory}>
            Refresh
          </button>
          <button className="btn btn-outline-success btn-sm" onClick={exportHistory}>
            Export CSV
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={triggerImport} disabled={importing}>
            {importing ? "Importing…" : "Import CSV"}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="d-none" onChange={handleImportFile} />
      </div>

      <div className="card p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-3">
            <select className="form-select" value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option value="">All Events</option>
              <option value="PURCHASE">Purchase</option>
              <option value="SALE">Sale</option>
              <option value="CANCELLATION_RESTOCK">Cancellation Restock</option>
              <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
              <option value="INITIAL_STOCK">Initial Stock</option>
            </select>
          </div>
          <div className="col-md-3 position-relative">
            <input
              type="text"
              className="form-control"
              placeholder="Search product..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onFocus={handleProductFocus}
              onBlur={handleProductBlur}
            />
            <input type="hidden" value={productId} />
            {productSearch.trim().length > 0 && showProductSuggestions && productSuggestions.length > 0 && (
              <div
                className="list-group position-absolute top-100 start-0 w-100 shadow-sm rounded overflow-hidden"
                style={{ maxHeight: "220px", zIndex: 1200, overflowY: "auto" }}
              >
                {productSuggestions.slice(0, 8).map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    className="list-group-item list-group-item-action py-2 px-3"
                    onMouseDown={() => handleProductSuggestionSelect(product)}
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            )}
            {selectedProductName && (
              <small className="text-muted d-block">Filtering by: {selectedProductName}</small>
            )}
            {!productSearch && (
              <small className="text-muted d-block">Leave blank to include all products.</small>
            )}
          </div>
          <div className="col-md-2">
            <input type="datetime-local" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="col-md-2">
            <input type="datetime-local" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Search note/ref"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchHistory();
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading stock history...</p>
      ) : items.length === 0 ? (
        <p className="text-muted">No stock history found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Event</th>
                <th>Change</th>
                <th>Previous</th>
                <th>New</th>
                <th>Reference</th>
                <th>By</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
            {paginatedHistory.map((entry) => (
                <tr key={entry._id}>
                  <td>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "-"}</td>
                  <td>{entry.product?.name || "-"}</td>
                  <td>{entry.eventType}</td>
                  <td>
                    <span
                      className={
                        Number(entry.quantityChange) >= 0
                          ? "stock-change stock-change-positive"
                          : "stock-change stock-change-negative"
                      }
                    >
                      {Number(entry.quantityChange) >= 0 ? "+" : "-"}
                      {Math.abs(Number(entry.quantityChange || 0))}
                    </span>
                  </td>
                  <td>{entry.previousStock}</td>
                  <td>{entry.newStock}</td>
                  <td>
                    {entry.referenceType || "-"}
                    {entry.referenceId ? ` (${entry.referenceId.slice(-8)})` : ""}
                  </td>
                  <td>{entry.actor?.name || "System"}</td>
                  <td>{entry.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination currentPage={historyPage} totalPages={totalHistoryPages} onPageChange={setHistoryPage} />
    </div>
  );
};

export default StockHistory;
