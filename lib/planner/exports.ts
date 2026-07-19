export function toCsv(rows: Record<string, string | number | boolean | null | undefined>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (value: unknown) => {
    const raw = value == null ? "" : String(value);
    if (/[",\n]/.test(raw)) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");
}

export function parseGuestCsv(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const required = ["first_name", "last_name"];
  for (const key of required) {
    if (!headers.includes(key)) {
      throw new Error(`CSV invalid: lipsește coloana ${key}`);
    }
  }

  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cols[index] ?? "";
    });
    return {
      first_name: row.first_name ?? "",
      last_name: row.last_name ?? "",
      email: row.email || undefined,
      phone: row.phone || undefined,
      side: row.side || "other",
      relationship: row.relationship || undefined,
      meal_preference: row.meal_preference || undefined,
      allergies: row.allergies || undefined,
    };
  });
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}
