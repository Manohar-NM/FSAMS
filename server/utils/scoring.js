const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

const SECTION_MAX = {
  partA: 20,
  partB: 20,
  partC: 25,
  partD: 15,
  partE: 10,
  partF: 5,
  partG: 5
};

const scoreRows = (rows = []) =>
  rows.reduce((sum, row) => {
    const max = Number(row.maxMarks) || 0;
    return sum + clamp(row.marks, 0, max);
  }, 0);

const capSection = (key, value) => clamp(value, 0, SECTION_MAX[key] || 0);

export const calculateScores = (parts = {}) => {
  if (parts.partA || parts.partB || parts.partC) {
    const sections = {
      partA: capSection("partA", scoreRows(parts.partA?.workload)),
      partB: capSection("partB", scoreRows(parts.partB?.results)),
      partC: capSection(
        "partC",
        scoreRows(parts.partC?.publications) +
          scoreRows(parts.partC?.patents) +
          scoreRows(parts.partC?.fundedProjects) +
          scoreRows(parts.partC?.consultancy) +
          scoreRows(parts.partC?.certifications) +
          scoreRows(parts.partC?.mouSupport)
      ),
      partD: capSection("partD", scoreRows(parts.partD?.activities)),
      partE: capSection("partE", scoreRows(parts.partE?.activities)),
      partF: capSection("partF", scoreRows(parts.partF?.goals)),
      partG: capSection("partG", scoreRows(parts.partG?.support))
    };
    const maxTotal = Object.values(SECTION_MAX).reduce((sum, value) => sum + value, 0);
    const rawTotal = Object.values(sections).reduce((sum, value) => sum + value, 0);
    const normalizedTotal = Math.round((rawTotal / maxTotal) * 100);

    return {
      teaching: sections.partA + sections.partB,
      research: sections.partC,
      service: sections.partD + sections.partE,
      sections,
      rawTotal,
      maxTotal,
      normalizedTotal,
      total: normalizedTotal
    };
  }

  const teaching = parts.teaching || {};
  const research = parts.research || {};
  const service = parts.service || {};

  const teachingScore =
    clamp(teaching.coursesHandled, 0, 8) * 5 +
    clamp(teaching.studentFeedback, 0, 10) * 4 +
    clamp(teaching.innovativeMethods, 0, 10) * 2;

  const researchScore =
    clamp(research.papersPublished, 0, 10) * 6 +
    clamp(research.patents, 0, 5) * 10 +
    clamp(research.fundedProjects, 0, 5) * 10;

  const serviceScore =
    clamp(service.committees, 0, 10) * 3 +
    clamp(service.mentoring, 0, 10) * 3 +
    clamp(service.outreach, 0, 10) * 2;

  return {
    teaching: teachingScore,
    research: researchScore,
    service: serviceScore,
    total: teachingScore + researchScore + serviceScore
  };
};
