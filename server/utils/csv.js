export const parseUserCsv = (buffer) => {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const [headerLine, ...rows] = text.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
  const required = ["name", "email", "role", "department", "password"];

  for (const key of required) {
    if (!headers.includes(key)) throw new Error(`CSV missing required column: ${key}`);
  }

  return rows.map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return headers.reduce((acc, header, index) => ({ ...acc, [header]: values[index] || "" }), {});
  });
};
