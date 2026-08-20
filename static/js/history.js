/* =============================================================
   WDS Detection History JS
   All search/sort/pagination happens client-side over the rows
   the server already rendered in the table — no new endpoints,
   no change to the underlying data or database model.
============================================================= */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var table = document.querySelector("[data-history-table]");
    if (!table) return;

    var tbody = table.querySelector("tbody");
    var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr[data-row]"));
    var searchInput = document.querySelector("[data-history-search]");
    var threatFilter = document.querySelector("[data-history-filter]");
    var countEl = document.querySelector("[data-history-count]");
    var paginationInfo = document.querySelector("[data-pagination-info]");
    var paginationControls = document.querySelector("[data-pagination-controls]");
    var emptyState = document.querySelector("[data-history-empty]");
    var tableWrap = document.querySelector("[data-history-tablewrap]");

    var PAGE_SIZE = 8;
    var currentPage = 1;
    var sortKey = "timestamp";
    var sortDir = "desc";

    function rowValue(row, key) {
      return row.getAttribute("data-" + key) || "";
    }

    function applyFilters() {
      var term = (searchInput && searchInput.value || "").trim().toLowerCase();
      var threat = threatFilter && threatFilter.value || "";

      var visible = rows.filter(function (row) {
        var haystack = (
          rowValue(row, "filename") + " " +
          rowValue(row, "threat") + " " +
          rowValue(row, "source")
        ).toLowerCase();

        var matchesTerm = !term || haystack.indexOf(term) !== -1;
        var matchesThreat = !threat || rowValue(row, "threat") === threat;
        return matchesTerm && matchesThreat;
      });

      return visible;
    }

    function sortRows(list) {
      var factor = sortDir === "asc" ? 1 : -1;
      return list.slice().sort(function (a, b) {
        var av = rowValue(a, sortKey);
        var bv = rowValue(b, sortKey);

        if (sortKey === "confidence" || sortKey === "timestamp") {
          av = parseFloat(av) || 0;
          bv = parseFloat(bv) || 0;
          return (av - bv) * factor;
        }
        return av.localeCompare(bv) * factor;
      });
    }

    function render() {
      var filtered = applyFilters();
      var sorted = sortRows(filtered);
      var totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
      if (currentPage > totalPages) currentPage = totalPages;

      rows.forEach(function (row) {
        row.classList.add("row-hidden");
      });

      var start = (currentPage - 1) * PAGE_SIZE;
      var pageRows = sorted.slice(start, start + PAGE_SIZE);
      pageRows.forEach(function (row) {
        row.classList.remove("row-hidden");
        tbody.appendChild(row);
      });

      if (countEl) {
        countEl.textContent = sorted.length + (sorted.length === 1 ? " record" : " records");
      }

      if (paginationInfo) {
        var from = sorted.length === 0 ? 0 : start + 1;
        var to = Math.min(start + PAGE_SIZE, sorted.length);
        paginationInfo.textContent = "Showing " + from + "\u2013" + to + " of " + sorted.length;
      }

      renderPaginationControls(totalPages);

      var isEmpty = rows.length === 0;
      var isFilteredEmpty = rows.length > 0 && sorted.length === 0;

      if (tableWrap) tableWrap.style.display = isEmpty ? "none" : "";
      if (emptyState) {
        emptyState.style.display = isEmpty || isFilteredEmpty ? "" : "none";
        var heading = emptyState.querySelector("h3");
        var body = emptyState.querySelector("p");
        if (heading && body) {
          if (isFilteredEmpty) {
            heading.textContent = "No matching detections";
            body.textContent = "Try a different search term or clear the filter.";
          } else {
            heading.textContent = "No detections yet";
            body.textContent = "Run an upload or start the live camera to build detection history.";
          }
        }
      }

      var pager = document.querySelector("[data-pagination]");
      if (pager) pager.style.display = sorted.length > PAGE_SIZE ? "" : "none";
    }

    function renderPaginationControls(totalPages) {
      if (!paginationControls) return;
      paginationControls.innerHTML = "";

      function makeBtn(label, page, opts) {
        opts = opts || {};
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "page-btn" + (opts.active ? " is-active" : "");
        btn.textContent = label;
        if (opts.disabled) btn.setAttribute("disabled", "disabled");
        btn.addEventListener("click", function () {
          currentPage = page;
          render();
        });
        return btn;
      }

      paginationControls.appendChild(
        makeBtn("\u2039", Math.max(1, currentPage - 1), { disabled: currentPage === 1 })
      );

      for (var p = 1; p <= totalPages; p++) {
        paginationControls.appendChild(makeBtn(String(p), p, { active: p === currentPage }));
      }

      paginationControls.appendChild(
        makeBtn("\u203a", Math.min(totalPages, currentPage + 1), { disabled: currentPage === totalPages })
      );
    }

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        currentPage = 1;
        render();
      });
    }

    if (threatFilter) {
      threatFilter.addEventListener("change", function () {
        currentPage = 1;
        render();
      });
    }

    table.querySelectorAll("th.sortable").forEach(function (th) {
      th.addEventListener("click", function () {
        var key = th.getAttribute("data-sort-key");
        if (sortKey === key) {
          sortDir = sortDir === "asc" ? "desc" : "asc";
        } else {
          sortKey = key;
          sortDir = "asc";
        }
        table.querySelectorAll("th.sortable").forEach(function (el) {
          el.classList.remove("sort-active");
          var arrow = el.querySelector(".sort-arrow");
          if (arrow) arrow.textContent = "\u2195";
        });
        th.classList.add("sort-active");
        var arrow = th.querySelector(".sort-arrow");
        if (arrow) arrow.textContent = sortDir === "asc" ? "\u2191" : "\u2193";
        render();
      });
    });

    render();
  });
})();
