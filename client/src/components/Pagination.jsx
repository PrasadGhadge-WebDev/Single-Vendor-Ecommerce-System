import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange, className = "" }) => {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const delta = 2;
  let startPage = Math.max(1, currentPage - delta);
  let endPage = Math.min(totalPages, currentPage + delta);

  if (currentPage <= delta + 1) {
    endPage = Math.min(totalPages, 1 + delta * 2);
  }

  if (currentPage >= totalPages - delta) {
    startPage = Math.max(1, totalPages - delta * 2);
  }

  const pages = [];
  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  const safeNavigate = (page) => {
    if (page < 1 || page > totalPages) return;
    if (page === currentPage) return;
    onPageChange(page);
  };

  return (
    <nav className={`d-flex justify-content-end mt-3 ${className}`}>
      <ul className="pagination mb-0">
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => safeNavigate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
        </li>

        {startPage > 1 && (
          <>
            <li className="page-item">
              <button type="button" className="page-link" onClick={() => safeNavigate(1)}>
                1
              </button>
            </li>
            {startPage > 2 && (
              <li className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            )}
          </>
        )}

        {pages.map((page) => (
          <li key={page} className={`page-item ${page === currentPage ? "active" : ""}`}>
            <button type="button" className="page-link" onClick={() => safeNavigate(page)}>
              {page}
            </button>
          </li>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <li className="page-item disabled">
                <span className="page-link">…</span>
              </li>
            )}
            <li className="page-item">
              <button type="button" className="page-link" onClick={() => safeNavigate(totalPages)}>
                {totalPages}
              </button>
            </li>
          </>
        )}

        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => safeNavigate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
