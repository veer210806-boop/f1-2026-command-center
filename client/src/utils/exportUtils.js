// ============================================================
// exportUtils.js — Lightweight RFC-4180 CSV Exporter
// Enables engineers to download timing matrices, telemetry traces,
// and championship standings without third-party dependencies.
// ============================================================

/**
 * Escapes a single CSV cell value per RFC-4180.
 */
export function escapeCsvCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts headers + rows arrays into an RFC-4180 CSV string.
 */
export function buildCsvContent(headers = [], rows = []) {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(","));
  return [headerLine, ...rowLines].join("\r\n");
}

/**
 * Triggers a browser CSV download and cleanly revokes the object URL.
 */
export function downloadCsvFile(filename, headers, rows) {
  if (typeof document === "undefined" || typeof Blob === "undefined") {
    return false;
  }
  const csv = buildCsvContent(headers, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
