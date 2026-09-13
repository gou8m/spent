/** Minimal RFC4180-ish CSV parse/stringify — handles quoted fields (with
 * embedded commas, newlines, and escaped "" quotes) without pulling in a
 * dependency for what's otherwise a handful of short, simple rows. */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let sawAnyField = false;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
    sawAnyField = false;
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      sawAnyField = true;
    } else if (c === ",") {
      endField();
      sawAnyField = true;
    } else if (c === "\n") {
      if (sawAnyField || field.length > 0) endRow();
    } else if (c === "\r") {
      // skip — \r\n line endings are handled by the \n branch
    } else {
      field += c;
      sawAnyField = true;
    }
  }
  if (sawAnyField || field.length > 0) endRow();

  return rows;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function stringifyCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(",")).join("\r\n");
}
