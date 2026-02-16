export function escapeCsvValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Quote if needed
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const header = columns.map(escapeCsvValue).join(",");
  const lines = rows.map((r) => columns.map((c) => escapeCsvValue(r[c])).join(","));
  // CRLF for Excel compatibility on Windows
  return [header, ...lines].join("\r\n") + "\r\n";
}

// Minimal CSV parser that supports quoted fields with commas and newlines.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }

    if (ch === "\r") {
      // ignore; handle on \n
      i += 1;
      continue;
    }

    if (ch === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }

    field += ch;
    i += 1;
  }

  // Flush last field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  // Excel on Windows often mis-detects UTF-8 CSV unless a BOM is present.
  const needsUtf8Bom = /text\/csv/i.test(mime);
  const blobParts = needsUtf8Bom ? ["\uFEFF", content] : [content];
  const blob = new Blob(blobParts, { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

