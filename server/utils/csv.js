const splitCsvLine = (line) => {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
};

export const parseUserCsv = (buffer) => {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const [headerLine, ...rows] = text.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(headerLine).map((h) => h.toLowerCase());
  const required = ["name", "email", "role", "department", "password"];

  for (const key of required) {
    if (!headers.includes(key)) throw new Error(`CSV missing required column: ${key}`);
  }

  return rows.map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((acc, header, index) => ({ ...acc, [header]: values[index] || "" }), {});
  });
};
