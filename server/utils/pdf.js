import puppeteer from "puppeteer";

const SECTION_MAX = { partA: 20, partB: 20, partC: 25, partD: 15, partE: 10, partF: 5, partG: 5 };

const titles = {
  partA: "Part A: General Information and Academic Work Load",
  partB: "Part B: Academic Results",
  partC: "Part C: R & D Activities",
  partD: "Part D: Institute / Department Level Activities",
  partE: "Part E: Foundation Level Activities",
  partF: "Part F: Future Job Progression",
  partG: "Part G: Expected Support from the Institute"
};

const tables = {
  partA: [{ key: "workload", title: "Academic Work Load", columns: ["semester", "courseCode", "courseTitle", "lectureHours", "tutorialHours", "practicalHours", "totalHours"] }],
  partB: [{ key: "results", title: "Academic Results", columns: ["semester", "courseCode", "courseTitle", "appeared", "passed", "passPercentage"] }],
  partC: [
    { key: "publications", title: "Publications", columns: ["title", "journal", "indexedIn", "authors"] },
    { key: "patents", title: "Patents", columns: ["title", "status", "applicationNo"] },
    { key: "fundedProjects", title: "Funded Projects", columns: ["title", "agency", "amount", "status"] },
    { key: "consultancy", title: "Consultancy", columns: ["workTitle", "client", "amount"] },
    { key: "certifications", title: "Certifications / Workshops", columns: ["program", "organizer", "duration", "type"] },
    { key: "mouSupport", title: "MoU Support", columns: ["organization", "activity", "outcome"] }
  ],
  partD: [{ key: "activities", title: "Institute / Department Level Activities", columns: ["activity", "role", "level", "outcome"] }],
  partE: [{ key: "activities", title: "Foundation Level Activities", columns: ["activity", "responsibility", "contribution"] }],
  partF: [{ key: "goals", title: "Future Job Progression", columns: ["goal", "timeline", "measurableOutcome"] }],
  partG: [{ key: "support", title: "Expected Support from the Institute", columns: ["supportRequired", "purpose", "expectedOutcome"] }]
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const label = (value) => value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());

const renderGeneralInfo = (generalInfo = {}) => `
  <table>
    <tbody>
      ${Object.entries(generalInfo)
        .map(([key, value]) => `<tr><th>${label(key)}</th><td>${escapeHtml(value || "-")}</td></tr>`)
        .join("")}
    </tbody>
  </table>
`;

const renderTable = (table, rows = []) => `
  <h3>${table.title}</h3>
  <table>
    <thead>
      <tr>
        ${table.columns.map((column) => `<th>${label(column)}</th>`).join("")}
        <th>Max Marks</th>
        <th>Marks Awarded</th>
      </tr>
    </thead>
    <tbody>
      ${
        rows.length
          ? rows
              .map(
                (row) => `
                  <tr>
                    ${table.columns.map((column) => `<td>${escapeHtml(row[column] || "-")}</td>`).join("")}
                    <td>${escapeHtml(row.maxMarks ?? 0)}</td>
                    <td>${escapeHtml(row.marks ?? 0)}</td>
                  </tr>
                `
              )
              .join("")
          : `<tr><td colspan="${table.columns.length + 2}">No entries</td></tr>`
      }
    </tbody>
  </table>
`;

const renderSection = (parts, scores, section) => `
  <section>
    <h2>${titles[section]} <span>${scores.sections?.[section] || 0}/${SECTION_MAX[section]}</span></h2>
    ${section === "partA" ? renderGeneralInfo(parts.partA?.generalInfo) : ""}
    ${(tables[section] || []).map((table) => renderTable(table, parts[section]?.[table.key] || [])).join("")}
  </section>
`;

export const generateAppraisalPdf = async (appraisal) => {
  const faculty = appraisal.userId || {};
  const parts = appraisal.parts || {};
  const scores = appraisal.scores || {};
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #17211c; padding: 28px; }
          h1 { margin: 0; color: #16352f; font-size: 24px; text-align: center; }
          h2 { background: #16352f; color: white; font-size: 15px; margin-top: 22px; padding: 9px 10px; }
          h2 span { float: right; color: #f4d28a; }
          h3 { color: #9f3c2f; font-size: 14px; margin-bottom: 6px; }
          p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 11px; }
          th, td { border: 1px solid #cbd5d1; padding: 7px; text-align: left; vertical-align: top; }
          th { background: #eef4f0; color: #16352f; }
          .meta { margin: 16px 0; }
          .score { border: 2px solid #16352f; padding: 12px; margin-top: 18px; }
          .score b { color: #9f3c2f; font-size: 18px; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <h1>Faculty Self Appraisal Form</h1>
        <p class="center">Alva's Institute of Engineering & Technology</p>
        <div class="meta">
          <table>
            <tbody>
              <tr><th>Faculty Name</th><td>${escapeHtml(faculty.name || "-")}</td><th>Faculty ID</th><td>${escapeHtml(faculty.facultyId || "-")}</td></tr>
              <tr><th>Department</th><td>${escapeHtml(appraisal.department || "-")}</td><th>Academic Year</th><td>${escapeHtml(appraisal.academicYear || "-")}</td></tr>
              <tr><th>Status</th><td>${escapeHtml(appraisal.status || "-")}</td><th>Generated</th><td>${new Date().toLocaleString()}</td></tr>
            </tbody>
          </table>
        </div>
        ${Object.keys(titles).map((section) => renderSection(parts, scores, section)).join("")}
        <div class="score">
          <p><b>Final Total: ${scores.normalizedTotal ?? scores.total ?? 0}/100</b></p>
          <p>Raw Marks: ${scores.rawTotal ?? 0}/${scores.maxTotal ?? 100}</p>
        </div>
        <h2>Remarks</h2>
        <p><b>Faculty:</b> ${escapeHtml(appraisal.remarks?.faculty || "-")}</p>
        <p><b>HOD:</b> ${escapeHtml(appraisal.remarks?.hod || "-")}</p>
        <p><b>Principal:</b> ${escapeHtml(appraisal.remarks?.principal || "-")}</p>
      </body>
    </html>`;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" } });
  await browser.close();
  return pdf;
};
