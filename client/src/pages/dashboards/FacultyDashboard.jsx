import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, FileText, Paperclip, Plus, Save, Send, Trash2 } from "lucide-react";
import api from "../../api/axios";
import AppraisalTable from "../../components/AppraisalTable";
import MetricCard from "../../components/MetricCard";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";

const SECTION_MAX = { partA: 20, partB: 20, partC: 25, partD: 15, partE: 10, partF: 5, partG: 5 };
const SECTION_ORDER = ["partA", "partB", "partC", "partD", "partE", "partF", "partG", "summary"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const DEFAULT_ACADEMIC_YEAR = "2025-26";

const titles = {
  partA: "Part A: General Information and Academic Work Load",
  partB: "Part B: Academic Results",
  partC: "Part C: R & D Activities",
  partD: "Part D: Institute / Department Level Activities",
  partE: "Part E: Foundation Level Activities",
  partF: "Part F: Future Job Progression",
  partG: "Part G: Expected Support from the Institute",
  summary: "Final Summary"
};

const tableDefinitions = {
  partA: [
    {
      key: "workload",
      title: "Academic Work Load",
      columns: ["semester", "courseCode", "courseTitle", "lectureHours", "tutorialHours", "practicalHours", "totalHours"],
      maxMarks: 20
    }
  ],
  partB: [
    {
      key: "results",
      title: "Academic Results",
      columns: ["semester", "courseCode", "courseTitle", "appeared", "passed", "passPercentage"],
      maxMarks: 20
    }
  ],
  partC: [
    { key: "publications", title: "Publications", columns: ["title", "journal", "indexedIn", "authors"], maxMarks: 5 },
    { key: "patents", title: "Patents", columns: ["title", "status", "applicationNo"], maxMarks: 4 },
    { key: "fundedProjects", title: "Funded Projects", columns: ["title", "agency", "amount", "status"], maxMarks: 5 },
    { key: "consultancy", title: "Consultancy", columns: ["workTitle", "client", "amount"], maxMarks: 4 },
    { key: "certifications", title: "Certifications / Workshops", columns: ["program", "organizer", "duration", "type"], maxMarks: 4 },
    { key: "mouSupport", title: "MoU Support", columns: ["organization", "activity", "outcome"], maxMarks: 3 }
  ],
  partD: [
    {
      key: "activities",
      title: "Institute / Department Level Activities",
      columns: ["activity", "role", "level", "outcome"],
      maxMarks: 15
    }
  ],
  partE: [
    { key: "activities", title: "Foundation Level Activities", columns: ["activity", "responsibility", "contribution"], maxMarks: 10 }
  ],
  partF: [{ key: "goals", title: "Future Job Progression", columns: ["goal", "timeline", "measurableOutcome"], maxMarks: 5 }],
  partG: [{ key: "support", title: "Expected Support from the Institute", columns: ["supportRequired", "purpose", "expectedOutcome"], maxMarks: 5 }]
};

const label = (value) => value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
const draftKey = (user, appraisalId = "current") => `fsams_faculty_draft_${user?.id || user?._id || user?.email || "current"}_${appraisalId || "current"}`;
const clampNumber = (value, max) => Math.max(0, Math.min(Number(max) || 0, Number(value) || 0));
const row = (maxMarks, data = {}) => ({ ...data, maxMarks, marks: 0 });
const emptyTableRow = (definition) =>
  definition.columns.reduce((acc, column) => ({ ...acc, [column]: "" }), { maxMarks: definition.maxMarks, marks: 0 });
const hourColumns = ["lectureHours", "tutorialHours", "practicalHours"];
const calculateTotalHours = (item) =>
  hourColumns.reduce((sum, column) => sum + (Number(item[column]) || 0), 0);

const emptyForm = (user, academicYear = DEFAULT_ACADEMIC_YEAR, semester = 1) => ({
  academicYear,
  semester,
  parts: {
    partA: {
      generalInfo: {
        name: user?.name || "",
        facultyId: user?.facultyId || "",
        designation: user?.designation || "",
        department: user?.department || "",
        dateOfJoining: "",
        qualification: "",
        specialization: ""
      },
      workload: [row(20, { semester: "", courseCode: "", courseTitle: "", lectureHours: "", tutorialHours: "", practicalHours: "", totalHours: "" })]
    },
    partB: {
      results: [row(20, { semester: "", courseCode: "", courseTitle: "", appeared: "", passed: "", passPercentage: "" })]
    },
    partC: {
      publications: [row(5, { title: "", journal: "", indexedIn: "", authors: "" })],
      patents: [row(4, { title: "", status: "", applicationNo: "" })],
      fundedProjects: [row(5, { title: "", agency: "", amount: "", status: "" })],
      consultancy: [row(4, { workTitle: "", client: "", amount: "" })],
      certifications: [row(4, { program: "", organizer: "", duration: "", type: "" })],
      mouSupport: [row(3, { organization: "", activity: "", outcome: "" })]
    },
    partD: { activities: [row(15, { activity: "", role: "", level: "", outcome: "" })] },
    partE: { activities: [row(10, { activity: "", responsibility: "", contribution: "" })] },
    partF: { goals: [row(5, { goal: "", timeline: "", measurableOutcome: "" })] },
    partG: { support: [row(5, { supportRequired: "", purpose: "", expectedOutcome: "" })] }
  },
  remarks: { faculty: "" }
});

const sectionScore = (parts, key) => {
  const raw = (tableDefinitions[key] || []).reduce((sum, table) => {
    const rows = parts[key]?.[table.key] || [];
    return sum + rows.reduce((rowSum, item) => rowSum + clampNumber(item.marks, item.maxMarks), 0);
  }, 0);
  return clampNumber(raw, SECTION_MAX[key]);
};

const calculateScores = (parts) => {
  const sections = Object.keys(SECTION_MAX).reduce((acc, key) => ({ ...acc, [key]: sectionScore(parts, key) }), {});
  const rawTotal = Object.values(sections).reduce((sum, value) => sum + value, 0);
  const maxTotal = Object.values(SECTION_MAX).reduce((sum, value) => sum + value, 0);
  return { sections, rawTotal, maxTotal, normalizedTotal: Math.round((rawTotal / maxTotal) * 100) };
};

const isRowStarted = (item, columns) => columns.some((column) => String(item[column] || "").trim()) || Number(item.marks) > 0;
const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;
const getEmailFormatError = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim()) ? "" : "Invalid email format";
const normalizeStep = (value) => (SECTION_ORDER.includes(value) ? value : "partA");
const isValidAcademicYear = (value) => /^\d{4}-\d{2}$/.test(String(value || "").trim());
const getPdfFileName = (item) => `FAA-${item.academicYear}-Semester-${item.semester || "NA"}.pdf`;
const getSubmittedAt = (item) => item?.submitted_at || item?.submittedAt;
const formatSubmittedOn = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
    : "N/A";
const getPdfErrorMessage = async (error) => {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    const text = await data.text();
    try {
      return JSON.parse(text).message || "Unable to generate PDF";
    } catch {
      return text || "Unable to generate PDF";
    }
  }
  return getErrorMessage(error, "Unable to generate PDF");
};

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [appraisals, setAppraisals] = useState([]);
  const [form, setForm] = useState(() => emptyForm(user));
  const [selectedId, setSelectedId] = useState(null);
  const [step, setStep] = useState("partA");
  const [message, setMessage] = useState("");
  const [proofs, setProofs] = useState([]);
  const [errors, setErrors] = useState({});
  const [action, setAction] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submissionNotice, setSubmissionNotice] = useState(null);
  const [newAppraisalOpen, setNewAppraisalOpen] = useState(false);
  const [newAppraisalForm, setNewAppraisalForm] = useState({ academicYear: DEFAULT_ACADEMIC_YEAR, semester: "1" });
  const [newAppraisalError, setNewAppraisalError] = useState("");
  const [hods, setHods] = useState([]);
  const [submitHodMode, setSubmitHodMode] = useState("select");
  const [submitHodEmail, setSubmitHodEmail] = useState("");
  const [manualHodEmail, setManualHodEmail] = useState("");
  const loadedRef = useRef(false);

  const scores = useMemo(() => calculateScores(form.parts), [form.parts]);
  const current = appraisals.find((item) => item._id === selectedId);
  const isLocked = Boolean(current?.is_locked);
  const submittedOn = getSubmittedAt(current);
  const editable = Boolean(selectedId) && !isLocked && (!current || ["draft", "returned_for_edit"].includes(current.status));
  const currentStepIndex = SECTION_ORDER.indexOf(step);

  const load = async () => {
    const { data } = await api.get("/appraisals/mine");
    setAppraisals(data.appraisals);
    return data.appraisals;
  };

  const loadHods = async () => {
    try {
      const { data } = await api.get("/users/hods");
      setHods(data.hods || []);
      if (!submitHodEmail && data.hods?.length) setSubmitHodEmail(data.hods[0].email);
    } catch {
      setHods([]);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadHods();
      const records = await load();
      const editableRecord = records.find((item) => ["draft", "returned_for_edit"].includes(item.status));
      if (editableRecord) {
        openExisting(editableRecord, false);
        loadedRef.current = true;
        return;
      }

      const localDraft = localStorage.getItem(draftKey(user));
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft);
          setForm(parsed.form || parsed);
          setStep(normalizeStep(parsed.step));
        } catch {
          localStorage.removeItem(draftKey(user));
        }
      }
      loadedRef.current = true;
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!loadedRef.current || !editable) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(draftKey(user, selectedId), JSON.stringify({ form, step }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [form, step, editable, selectedId, user]);

  useEffect(() => {
    if (!loadedRef.current || !editable) return;
    const timer = window.setTimeout(() => {
      save(true, step, { background: true });
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [form, step, editable, selectedId]);

  const validateNumberKey = (event) => {
    if (["-", "+", "e", "E"].includes(event.key)) event.preventDefault();
  };

  const validateStep = (section = step) => {
    const nextErrors = {};
    (tableDefinitions[section] || []).forEach((table) => {
      (form.parts[section]?.[table.key] || []).forEach((item, index) => {
        const marks = Number(item.marks) || 0;
        if (marks < 0) nextErrors[`${section}.${table.key}.${index}`] = "Negative marks are not allowed.";
        if (marks > Number(item.maxMarks || 0)) nextErrors[`${section}.${table.key}.${index}`] = `Maximum allowed marks is ${item.maxMarks}.`;
      });
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAllSections = () => {
    const nextErrors = {};
    const general = form.parts.partA.generalInfo;

    if (!form.academicYear?.trim()) nextErrors.academicYear = "Academic year is required.";
    if (!SEMESTERS.includes(Number(form.semester))) nextErrors.semester = "Semester is required.";
    ["name", "facultyId", "department"].forEach((field) => {
      if (!String(general[field] || "").trim()) nextErrors[`partA.generalInfo.${field}`] = `${label(field)} is required.`;
    });

    Object.keys(SECTION_MAX).forEach((section) => {
      (tableDefinitions[section] || []).forEach((table) => {
        (form.parts[section]?.[table.key] || []).forEach((item, index) => {
          const marks = Number(item.marks) || 0;
          if (marks < 0) nextErrors[`${section}.${table.key}.${index}`] = "Negative marks are not allowed.";
          if (marks > Number(item.maxMarks || 0)) nextErrors[`${section}.${table.key}.${index}`] = `Maximum allowed marks is ${item.maxMarks}.`;
        });
      });
    });

    setErrors(nextErrors);
    const firstSectionError = Object.keys(nextErrors).find((key) => key.startsWith("part"))?.split(".")[0];
    if (firstSectionError) {
      setStep(normalizeStep(firstSectionError));
      setMessage(Object.values(nextErrors)[0]);
      return false;
    }
    if (Object.keys(nextErrors).length) {
      setMessage(Object.values(nextErrors)[0]);
      return false;
    }
    return true;
  };

  const setGeneral = (field, value) => {
    setForm((prev) => ({
      ...prev,
      parts: { ...prev.parts, partA: { ...prev.parts.partA, generalInfo: { ...prev.parts.partA.generalInfo, [field]: value } } }
    }));
  };

  const setAcademicYear = (value) => setForm((prev) => ({ ...prev, academicYear: value }));
  const setSemester = (value) => setForm((prev) => ({ ...prev, semester: Number(value) }));

  const openNewAppraisal = () => {
    setNewAppraisalForm({ academicYear: DEFAULT_ACADEMIC_YEAR, semester: "1" });
    setNewAppraisalError("");
    setNewAppraisalOpen(true);
  };

  useEffect(() => {
    window.addEventListener("fsams:new-appraisal", openNewAppraisal);
    return () => window.removeEventListener("fsams:new-appraisal", openNewAppraisal);
  }, []);

  const createNewAppraisal = async (event) => {
    event.preventDefault();
    const academicYear = String(newAppraisalForm.academicYear || "").trim();
    const semester = Number(newAppraisalForm.semester);

    if (!isValidAcademicYear(academicYear)) {
      setNewAppraisalError("Academic year must be in YYYY-YY format.");
      return;
    }
    if (!SEMESTERS.includes(semester)) {
      setNewAppraisalError("Semester is required.");
      return;
    }
    if (appraisals.some((item) => item.academicYear === academicYear && Number(item.semester) === semester)) {
      setNewAppraisalError("Appraisal already exists for this academic year and semester.");
      return;
    }

    setAction("creating");
    try {
      const draft = emptyForm(user, academicYear, semester);
      const { data } = await api.post("/appraisals", { ...draft, currentStep: "partA" });
      setSelectedId(data.appraisal._id);
      setForm(draft);
      setStep("partA");
      setErrors({});
      setProofs([]);
      setMessage("New appraisal draft created.");
      setNewAppraisalOpen(false);
      await load();
    } catch (error) {
      setNewAppraisalError(getErrorMessage(error, "Failed to create appraisal"));
    } finally {
      setAction("");
    }
  };

  const updateCell = (section, table, index, field, value) => {
    setForm((prev) => {
      const rows = [...prev.parts[section][table]];
      const nextValue = field === "marks" ? clampNumber(value, rows[index].maxMarks) : hourColumns.includes(field) ? Math.max(0, Number(value) || 0) : value;
      const nextRow = { ...rows[index], [field]: nextValue };
      rows[index] = section === "partA" && table === "workload" && hourColumns.includes(field)
        ? { ...nextRow, totalHours: calculateTotalHours(nextRow) }
        : nextRow;
      return { ...prev, parts: { ...prev.parts, [section]: { ...prev.parts[section], [table]: rows } } };
    });
  };

  const addRow = (section, tableKey) => {
    const definition = tableDefinitions[section].find((table) => table.key === tableKey);
    setForm((prev) => ({
      ...prev,
      parts: { ...prev.parts, [section]: { ...prev.parts[section], [tableKey]: [...prev.parts[section][tableKey], emptyTableRow(definition)] } }
    }));
  };

  const removeRow = (section, tableKey, index) => {
    setForm((prev) => {
      const rows = prev.parts[section][tableKey].filter((_, rowIndex) => rowIndex !== index);
      return { ...prev, parts: { ...prev.parts, [section]: { ...prev.parts[section], [tableKey]: rows.length ? rows : prev.parts[section][tableKey] } } };
    });
  };

  const save = async (silent = false, stepToSave = step, options = {}) => {
    if (!validateStep(stepToSave === "summary" ? step : stepToSave)) return null;
    if (!options.background) setAction("saving");
    try {
      const { data } = await api.post("/appraisals", { ...form, _id: selectedId || undefined, currentStep: normalizeStep(stepToSave) });
      setSelectedId(data.appraisal._id);
      localStorage.setItem(draftKey(user, data.appraisal._id), JSON.stringify({ form, step: normalizeStep(stepToSave) }));
      if (!silent) setMessage("Draft Saved Successfully");
      await load();
      return data.appraisal;
    } catch (error) {
      if (!options.background) setMessage(getErrorMessage(error, "Failed to save draft"));
      return null;
    } finally {
      if (!options.background) setAction("");
    }
  };

  const submit = async () => {
    setConfirmSubmit(false);
    if (!validateAllSections()) return;
    const hodEmail = submitHodMode === "manual" ? manualHodEmail.trim() : submitHodEmail.trim();
    if (hodEmail && getEmailFormatError(hodEmail)) {
      setMessage("Enter a valid HOD email address.");
      return;
    }
    setAction("submitting");
    try {
      const saved = await save(true, "summary", { background: true });
      const id = saved?._id || selectedId;
      if (!id) throw new Error("Draft must be saved before submission.");
      const { data } = await api.patch(`/appraisals/${id}/submit`, { hodEmail });
      const submittedAt = getSubmittedAt(data.appraisal);
      localStorage.removeItem(draftKey(user, id));
      setSelectedId(data.appraisal._id);
      setAppraisals((items) => items.map((item) => (item._id === data.appraisal._id ? data.appraisal : item)));
      setMessage(`Appraisal locked for HOD review. Submitted on: ${formatSubmittedOn(submittedAt)}`);
      setSubmissionNotice({ submittedAt });
      await load();
    } catch (error) {
      setMessage(getErrorMessage(error, "Submission failed"));
    } finally {
      setAction("");
    }
  };

  const uploadProofs = async () => {
    if (!selectedId || !proofs.length) return setMessage("Save the draft first, then attach proof documents.");
    const payload = new FormData();
    Array.from(proofs).forEach((file) => payload.append("proofs", file));
    setAction("uploading");
    try {
      await api.post(`/appraisals/${selectedId}/proofs`, payload);
      setProofs([]);
      setMessage("Proof documents uploaded.");
      await load();
    } catch (error) {
      setMessage(getErrorMessage(error, "Proof upload failed"));
    } finally {
      setAction("");
    }
  };

  const openExisting = (item, showMessage = true) => {
    setSelectedId(item._id);
    setForm({
      academicYear: item.academicYear,
      semester: Number(item.semester) || 1,
      parts: item.parts?.partA ? item.parts : emptyForm(user).parts,
      remarks: { faculty: item.remarks?.faculty || "" }
    });
    setStep(normalizeStep(item.currentStep));
    setErrors({});
    if (showMessage) setMessage("Appraisal opened.");
  };

  const download = async (item) => {
    setAction("downloading");
    try {
      const response = await api.get(`/appraisals/${item._id}/pdf`, { responseType: "blob" });
      const contentType = response.headers["content-type"] || "";
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: "application/pdf" });

      if (!contentType.includes("application/pdf") || blob.size === 0) {
        throw new Error("Unable to generate PDF");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getPdfFileName(item);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("PDF downloaded successfully.");
    } catch (error) {
      setMessage(await getPdfErrorMessage(error));
    } finally {
      setAction("");
    }
  };

  const downloadCurrent = async () => {
    const appraisal = editable ? await save(true, step) : { _id: selectedId, academicYear: form.academicYear, semester: form.semester };
    if (appraisal?._id) await download(appraisal);
  };

  const goToStep = async (target) => {
    if (SECTION_ORDER.indexOf(target) > currentStepIndex && !validateStep()) return;
    if (editable) await save(true, target);
    setStep(target);
    setMessage("");
  };

  const next = async () => {
    if (!validateStep()) return;
    const target = SECTION_ORDER[Math.min(currentStepIndex + 1, SECTION_ORDER.length - 1)];
    if (editable) await save(true, target);
    setStep(target);
  };

  const previous = async () => {
    const target = SECTION_ORDER[Math.max(currentStepIndex - 1, 0)];
    if (editable) await save(true, target);
    setStep(target);
  };

  const sectionComplete = (section) => section === "summary" || (scores.sections[section] || 0) > 0;
  const busy = Boolean(action);

  const renderStepper = () => (
    <div className="mb-6 overflow-x-auto border-b border-slate-200 bg-white px-4 py-4">
      <div className="flex min-w-[760px] items-center">
        {SECTION_ORDER.map((section, index) => {
          const active = section === step;
          const completed = sectionComplete(section) && index < currentStepIndex;
          return (
            <div key={section} className="flex flex-1 items-center">
              <button
                type="button"
                disabled={busy}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-md border px-3 text-sm font-bold transition ${
                  active
                    ? "border-academic-teal bg-academic-teal text-white shadow-sm"
                    : completed
                      ? "border-emerald-100 bg-emerald-50 text-academic-leaf"
                      : "border-slate-200 bg-white text-slate-600"
                }`}
                onClick={() => goToStep(section)}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    active ? "bg-white text-academic-teal" : completed ? "bg-academic-leaf text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {completed ? <Check size={14} /> : section === "summary" ? "R" : section.replace("part", "")}
                </span>
                <span>{section === "summary" ? "Final Review" : section.replace("part", "Part ")}</span>
              </button>
              {index < SECTION_ORDER.length - 1 && <div className={`mx-2 h-px w-8 ${completed ? "bg-academic-leaf" : "bg-slate-200"}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTable = (section, table) => (
    <div key={table.key} className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-semibold text-academic-ink">{table.title}</h3>
          <p className="text-xs text-slate-500">Maximum marks per row: {table.maxMarks}. Negative values are blocked.</p>
        </div>
        <button type="button" className="btn-secondary px-3 py-1.5" disabled={!editable || busy} onClick={() => addRow(section, table.key)}>
          <Plus size={15} /> Add Row
        </button>
      </div>
      <div className="overflow-x-auto px-4 pb-4">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-white text-left text-xs uppercase text-slate-500">
            <tr>
              {table.columns.map((column) => (
                <th key={column} className="w-56 px-3 py-3">{label(column)}</th>
              ))}
              <th className="w-28 px-3 py-3">Max</th>
              <th className="w-32 px-3 py-3">Marks</th>
              <th className="w-24 px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {form.parts[section][table.key].map((item, index) => {
              const errorKey = `${section}.${table.key}.${index}`;
              const started = isRowStarted(item, table.columns);
              return (
                <tr key={`${table.key}-${index}`} className={started ? "bg-emerald-50/30" : "bg-white"}>
                  {table.columns.map((column) => (
                    <td key={column} className="px-3 py-3 align-top">
                      <input
                        className={`input ${column === "totalHours" ? "bg-slate-100 font-bold text-academic-ink" : ""}`}
                        disabled={!editable || column === "totalHours"}
                        type={hourColumns.includes(column) || column === "totalHours" ? "number" : "text"}
                        min={hourColumns.includes(column) || column === "totalHours" ? "0" : undefined}
                        value={item[column] || ""}
                        onKeyDown={hourColumns.includes(column) || column === "totalHours" ? validateNumberKey : undefined}
                        onPaste={(event) => {
                          if ((hourColumns.includes(column) || column === "totalHours") && event.clipboardData.getData("text").includes("-")) event.preventDefault();
                        }}
                        onChange={(event) => updateCell(section, table.key, index, column, event.target.value)}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-3 align-top">
                    <input className="input bg-slate-100" type="number" min="0" value={item.maxMarks} disabled />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input
                      className={`input ${errors[errorKey] ? "border-red-400" : ""}`}
                      type="number"
                      min="0"
                      max={item.maxMarks}
                      disabled={!editable}
                      value={item.marks}
                      onKeyDown={validateNumberKey}
                      onPaste={(event) => {
                        if (event.clipboardData.getData("text").includes("-")) event.preventDefault();
                      }}
                      onChange={(event) => updateCell(section, table.key, index, "marks", event.target.value)}
                    />
                    {errors[errorKey] && <p className="mt-1 text-xs text-red-600">{errors[errorKey]}</p>}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <button type="button" className="btn-secondary px-2 py-2" disabled={!editable || busy} onClick={() => removeRow(section, table.key, index)}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSectionPage = (section) => (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-academic-teal">Faculty Self Appraisal</p>
          <h2 className="mt-1 text-3xl font-bold text-academic-ink">{titles[section]}</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Complete this section, save the draft, then continue to the next page. Scores are capped at the prescribed maximum marks.
          </p>
        </div>
        <div className="min-w-44 rounded-lg border border-emerald-100 bg-emerald-50 px-5 py-4 text-right">
          <p className="text-xs font-bold uppercase text-slate-500">Section Score</p>
          <p className="text-3xl font-black text-academic-leaf">{scores.sections[section]}/{SECTION_MAX[section]}</p>
        </div>
      </div>

      {section === "partA" && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-academic-ink">General Information</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Object.entries(form.parts.partA.generalInfo).map(([field, value]) => (
              <label key={field}>
                <span className="label normal-case">{label(field)}</span>
                <input className="input mt-1" disabled={!editable} value={value} onChange={(event) => setGeneral(field, event.target.value)} />
                {errors[`partA.generalInfo.${field}`] && <p className="mt-1 text-xs text-red-600">{errors[`partA.generalInfo.${field}`]}</p>}
              </label>
            ))}
          </div>
        </div>
      )}

      {errors[`${section}.required`] && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errors[`${section}.required`]}</p>}
      {(tableDefinitions[section] || []).map((table) => renderTable(section, table))}
    </div>
  );

  const renderSummary = () => (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-academic-teal">Final Review</p>
          <h2 className="mt-1 text-3xl font-bold text-academic-ink">Final Summary</h2>
          <p className="text-sm text-slate-500">Review section totals before final submission to HOD.</p>
        </div>
        <div className="rounded-lg border border-academic-teal/20 bg-academic-teal px-5 py-4 text-right text-white">
          <p className="text-xs font-bold uppercase text-white/75">Final Score</p>
          <p className="text-3xl font-black">{scores.normalizedTotal}/100</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-academic-ink">Faculty Details</h3>
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div><dt className="text-slate-500">Name</dt><dd className="font-semibold">{form.parts.partA.generalInfo.name || "-"}</dd></div>
            <div><dt className="text-slate-500">Faculty ID</dt><dd className="font-semibold">{form.parts.partA.generalInfo.facultyId || "-"}</dd></div>
            <div><dt className="text-slate-500">Department</dt><dd className="font-semibold">{form.parts.partA.generalInfo.department || "-"}</dd></div>
            <div><dt className="text-slate-500">Academic Year</dt><dd className="font-semibold">{form.academicYear || "-"}</dd></div>
            <div><dt className="text-slate-500">Semester</dt><dd className="font-semibold">{form.semester || "-"}</dd></div>
            <div><dt className="text-slate-500">Designation</dt><dd className="font-semibold">{form.parts.partA.generalInfo.designation || "-"}</dd></div>
            <div><dt className="text-slate-500">Status</dt><dd><StatusBadge status={current?.status || "draft"} /></dd></div>
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-academic-ink">Section Totals</h3>
          <div className="space-y-2">
            {Object.keys(SECTION_MAX).map((section) => (
              <div key={section} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                <span className="font-medium">{titles[section]}</span>
                <span className="font-black text-academic-teal">{scores.sections[section]}/{SECTION_MAX[section]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md bg-emerald-50 px-3 py-3 text-sm font-bold text-academic-leaf">
            Grand Total: {scores.rawTotal}/{scores.maxTotal} | Normalized Score: {scores.normalizedTotal}/100
          </div>
        </div>
      </div>

      <label className="mt-5 block rounded-lg border border-slate-200 bg-white p-4">
        <span className="label">Faculty Remarks</span>
        <textarea
          className="input mt-1 min-h-24"
          disabled={!editable}
          value={form.remarks.faculty}
          onChange={(event) => setForm({ ...form, remarks: { faculty: event.target.value } })}
        />
      </label>
    </div>
  );

  return (
    <DashboardLayout
      title="Faculty Dashboard"
      subtitle="Create, submit, track, and download self appraisal forms."
      headerAction={
        <button type="button" className="btn-primary whitespace-nowrap" onClick={openNewAppraisal}>
          <Plus size={18} /> New Appraisal
        </button>
      }
    >
      <section id="dashboard-overview" className="mb-5 scroll-mt-28 grid gap-4 md:grid-cols-3">
        <div id="profile-panel" className="glass scroll-mt-28 rounded-lg p-5 md:col-span-2">
          <p className="text-sm font-semibold text-academic-teal">Faculty Profile</p>
          <h2 className="mt-2 text-2xl font-bold text-academic-ink">{user.name}</h2>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <span className="rounded-md bg-white px-3 py-2"><b>ID:</b> {user.facultyId || "-"}</span>
            <span className="rounded-md bg-white px-3 py-2"><b>Department:</b> {user.department}</span>
            <span className="rounded-md bg-white px-3 py-2"><b>Designation:</b> {user.designation || "-"}</span>
          </div>
        </div>
        <div className="glass rounded-lg p-5">
          <p className="text-sm font-semibold text-slate-500">Appraisal Progress</p>
          <div className="mt-4"><StatusBadge status={current?.status || "draft"} /></div>
          <p className="mt-3 text-xs font-bold uppercase text-slate-500">Current Appraisal</p>
          <p className="mt-1 text-sm font-semibold text-academic-ink">{form.academicYear || "-"} | Semester {form.semester || "-"}</p>
          <p className="mt-3 text-3xl font-bold text-academic-ink">{scores.normalizedTotal}/100</p>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard title="Section Marks" value={`${scores.rawTotal}/${scores.maxTotal}`} />
        <MetricCard title="Final Score" value={`${scores.normalizedTotal}/100`} accent="bg-academic-leaf" />
        <MetricCard title="Status" value={current?.status ? current.status.replaceAll("_", " ") : "Draft"} accent="bg-academic-gold" />
      </div>

      <div className="mt-8 space-y-8">
        <section id="appraisal-workflow" className="scroll-mt-28 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-academic-teal">Page-wise Appraisal Workflow</p>
              <h2 className="mt-1 text-2xl font-bold text-academic-ink">Faculty Self Appraisal Form</h2>
              <p className="text-sm text-slate-500">One part per page. Use Next and Previous to move through the appraisal.</p>
            </div>
            <label className="block w-full md:w-40">
              <span className="label">Academic Year</span>
              <input className="input mt-1" disabled={!editable} value={form.academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
              {errors.academicYear && <p className="mt-1 text-xs text-red-600">{errors.academicYear}</p>}
            </label>
            <label className="block w-full md:w-32">
              <span className="label">Semester</span>
              <select className="input mt-1" disabled={!editable} value={form.semester} onChange={(event) => setSemester(event.target.value)}>
                {SEMESTERS.map((semester) => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
              {errors.semester && <p className="mt-1 text-xs text-red-600">{errors.semester}</p>}
            </label>
          </div>

          {message && (
            <p className={`mx-6 mt-4 rounded-md px-3 py-2 text-sm ${message.toLowerCase().includes("failed") || message.toLowerCase().includes("required") || message.toLowerCase().includes("maximum") ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-700"}`}>
              {message}
            </p>
          )}
          {selectedId && isLocked && (
            <div className="mx-6 mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <p className="font-semibold">Status: Locked for HOD Review</p>
              <p>Submitted on: {formatSubmittedOn(submittedOn)}</p>
            </div>
          )}

          {renderStepper()}

          <div className="min-h-[calc(100vh-360px)] bg-slate-50/70">
            {step === "summary" ? renderSummary() : renderSectionPage(step)}
          </div>

          <div className="mx-6 mt-5 rounded-lg border border-dashed border-slate-300 bg-white p-4">
            <span className="label">Proofs / Documents</span>
            <input className="input mt-2" type="file" multiple disabled={!editable} onChange={(event) => setProofs(event.target.files)} />
            <button type="button" className="btn-secondary mt-3" disabled={!editable || busy} onClick={uploadProofs}>
              <Paperclip size={18} /> {action === "uploading" ? "Uploading..." : "Upload Proofs"}
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-5">
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-secondary" disabled={currentStepIndex === 0 || busy} onClick={previous}>
                <ArrowLeft size={18} /> {action === "saving" ? "Saving..." : "Previous"}
              </button>
              {step !== "summary" && (
                <button type="button" className="btn-primary" disabled={busy} onClick={next}>
                  {action === "saving" ? "Saving..." : "Next"} <ArrowRight size={18} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-secondary" disabled={!editable || busy} onClick={() => save(false)}>
                <Save size={18} /> {action === "saving" ? "Saving..." : "Save Draft"}
              </button>
              {step === "summary" && (
                <>
                  <button type="button" className="btn-secondary" disabled={busy} onClick={downloadCurrent}>
                    <Download size={18} /> {action === "downloading" ? "Downloading..." : "Download PDF"}
                  </button>
                  <button type="button" className="btn-primary" disabled={!editable || busy} onClick={() => setConfirmSubmit(true)}>
                    <Send size={18} /> {action === "submitting" ? "Submitting..." : "Submit Final"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <section id="my-appraisals" className="min-w-0 scroll-mt-28 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="text-academic-teal" size={20} />
            <h2 className="text-xl font-bold text-academic-ink">My Appraisals</h2>
          </div>
          <AppraisalTable
            appraisals={appraisals}
            mode="faculty"
            actions={(item) => (
              <div className="flex flex-wrap gap-2">
                <button className="btn-secondary px-3 py-1.5" onClick={() => openExisting(item)}>Open</button>
                <button className="btn-secondary px-3 py-1.5" onClick={() => download(item)}><Download size={15} /> PDF</button>
              </div>
            )}
          />
        </section>
      </div>

      {newAppraisalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-academic-ink">New Appraisal</h3>
            <p className="mt-2 text-sm text-slate-600">Select the academic year and semester for the new draft.</p>
            <form className="mt-5 space-y-4" onSubmit={createNewAppraisal}>
              <label className="block">
                <span className="label">Academic Year</span>
                <input
                  className="input mt-1"
                  placeholder="2025-26"
                  value={newAppraisalForm.academicYear}
                  onChange={(event) => setNewAppraisalForm({ ...newAppraisalForm, academicYear: event.target.value })}
                  required
                />
              </label>
              <label className="block">
                <span className="label">Semester</span>
                <select
                  className="input mt-1"
                  value={newAppraisalForm.semester}
                  onChange={(event) => setNewAppraisalForm({ ...newAppraisalForm, semester: event.target.value })}
                >
                  {SEMESTERS.map((semester) => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
              </label>
              {newAppraisalError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{newAppraisalError}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" disabled={action === "creating"} onClick={() => setNewAppraisalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={action === "creating"}>
                  <Plus size={18} /> {action === "creating" ? "Creating..." : "Create Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-academic-ink">Submit final appraisal?</h3>
            <p className="mt-2 text-sm text-slate-600">
              After submission, this form will be locked and sent to the HOD for review. You can edit again only if the HOD returns it for correction.
            </p>
            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-academic-ink">Send to HOD</p>
              <div className="mt-3 grid gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="hod-submit-mode"
                    checked={submitHodMode === "select"}
                    onChange={() => setSubmitHodMode("select")}
                  />
                  Select from department HOD list
                </label>
                <select
                  className="input"
                  disabled={submitHodMode !== "select" || !hods.length}
                  value={submitHodEmail}
                  onChange={(event) => setSubmitHodEmail(event.target.value)}
                >
                  {hods.length ? (
                    hods.map((hod) => (
                      <option key={hod._id} value={hod.email}>
                        {hod.name} - {hod.email} ({hod.department})
                      </option>
                    ))
                  ) : (
                    <option value="">No active HOD found for your department</option>
                  )}
                </select>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="hod-submit-mode"
                    checked={submitHodMode === "manual"}
                    onChange={() => setSubmitHodMode("manual")}
                  />
                  Type HOD email manually
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="hod.department@example.com"
                  disabled={submitHodMode !== "manual"}
                  value={manualHodEmail}
                  onChange={(event) => setManualHodEmail(event.target.value)}
                />
                <p className="text-xs text-slate-500">Manual email must match an active HOD account in the system.</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => setConfirmSubmit(false)}>Cancel</button>
              <button type="button" className="btn-primary" disabled={busy} onClick={submit}>
                <Send size={18} /> {action === "submitting" ? "Submitting..." : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {submissionNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-academic-ink">Appraisal locked for HOD review</h3>
            <p className="mt-4 text-sm font-semibold text-slate-600">Submitted on:</p>
            <p className="mt-1 text-lg font-bold text-academic-ink">{formatSubmittedOn(submissionNotice.submittedAt)}</p>
            <div className="mt-5 flex justify-end">
              <button type="button" className="btn-primary" onClick={() => setSubmissionNotice(null)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
