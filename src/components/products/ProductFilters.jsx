// ─── ProductFilters ──────────────────────────────────────────────────────────
// Search + quick chips + category / status selects that drive the product grid.
// Controlled: parent owns state so results and counts stay in sync.

import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { QUICK_FILTERS, CATEGORIES, STATUS } from "../../data/products";

export default function ProductFilters({
  query,
  setQuery,
  quick,
  setQuick,
  category,
  setCategory,
  status,
  setStatus,
  resultCount,
  onReset,
}) {
  const hasActive = query || quick !== "all" || category !== "All" || status !== "all";

  return (
    <div className="prod-filterbar">
      {/* Quick chips */}
      <div className="prod-chip-row" role="tablist" aria-label="Quick product filters">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={quick === f.id}
            onClick={() => setQuick(f.id)}
            className={`prod-chip ${quick === f.id ? "is-active" : ""}`}
          >
            <i className={f.icon} aria-hidden="true" />
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Search + selects */}
      <div className="prod-filter-controls">
        <div className="prod-search-wrap">
          <Search className="prod-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories, tech…"
            aria-label="Search products"
            className="prod-search-input"
          />
          {query && (
            <button className="prod-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="prod-select-wrap">
          <SlidersHorizontal className="prod-select-icon" aria-hidden="true" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="prod-select"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>
        </div>

        <div className="prod-select-wrap">
          <span className="prod-select-dot" aria-hidden="true" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
            className="prod-select"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Result summary */}
      <div className="prod-result-row">
        <span className="prod-result-count">
          {resultCount} {resultCount === 1 ? "product" : "products"}
        </span>
        {hasActive && (
          <button onClick={onReset} className="prod-reset">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
