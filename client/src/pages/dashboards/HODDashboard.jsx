import React from "react";
import { Check, Eye, FileText, Loader2, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import AppraisalTable from "../../components/AppraisalTable";
import MetricCard from "../../components/MetricCard";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../../components/StatusBadge";

const sectionTitles = {
  partA: "Part A: General Information and Academic Work Load",
  partB: "Part B: Academic Results",
  partC: "Part C: R & D Activities",
  partD: "Part D: Institute / Department Level Activities",
  partE: "Part E: Foundation Level Activities",
  partF: "Part F: Future Job Progression",
  partG: "Part G: Expected Support from the Institute"
};

const sectionMax = { partA: 20, partB: 20, partC: 25, partD: 15, partE: 10, partF: 5, partG: 5 };

const label = (value) => value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;
const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");
const getSubmittedAt = (item) => item?.submitted_at || item?.submittedAt;
const displayValue = (value) => (value === 0 || value ? String(value) : "-");

export default function HODDashboard() {
  const { user } = useAuth();
  const [appraisals, setAppraisals] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [viewing, setViewing] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/appraisals/department");
      setAppraisals(data.appraisals);
      const facultyResponse = await api.get("/users/department/faculty");
      setFaculty(facultyResponse.data.faculty);
    } catch (error) {
      setMessage(getErrorMessage(error, "Unable to load HOD appraisal queue"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openReview = async (item) => {
    setMessage("");
    setViewLoading(true);
    try {
      const { data } = await api.get(`/appraisals/${item._id}`);
      setViewing(data.appraisal);
    } catch (error) {
      setMessage(getErrorMessage(error, "Loading appraisal failed"));
    } finally {
      setViewLoading(false);
    }
  };

  const requestAction = (item, type) => {
    const text = remarks[item._id] || "";
    if (["return", "reject"].includes(type) && !text.trim()) {
      setMessage(type === "reject" ? "Rejection reason is required." : "Return remarks are required.");
      return;
    }
    setMessage("");
    setConfirmAction({ item, type, remarks: text });
  };

  const runAction = async () => {
    if (!confirmAction) return;
    const { item, type } = confirmAction;
    const text = remarks[item._id] || confirmAction.remarks || "";
    if (["return", "reject"].includes(type) && !text.trim()) {
      setConfirmAction({ ...confirmAction, error: type === "reject" ? "Rejection reason is required." : "Return remarks are required." });
      return;
    }
    setBusyId(`${item._id}:${type}`);
    try {
      await api.patch(`/appraisals/${item._id}/hod/${type}`, { remarks: text, reason: text });
      setConfirmAction(null);
      setViewing(null);
      setRemarks((current) => ({ ...current, [item._id]: "" }));
      setMessage(
        type === "approve"
          ? "Appraisal approved by HOD and sent to Principal."
          : type === "return"
            ? "Appraisal returned to faculty for correction."
            : "Appraisal rejected and locked."
      );
      window.dispatchEvent(new Event("fsams:notifications-refresh"));
      await load();
    } catch (error) {
      setMessage(
        getErrorMessage(
          error,
          type === "approve" ? "Approval failed" : type === "return" ? "Unable to return appraisal" : "Failed to reject appraisal"
        )
      );
    } finally {
      setBusyId("");
    }
  };

  const actionLabel = (type) => ({ approve: "Approve", return: "Return", reject: "Reject" }[type] || type);
  const progressLabel = (type) => ({ approve: "Approving...", return: "Returning...", reject: "Rejecting..." }[type] || "Processing...");

  const renderValue = (value) => {
    if (Array.isArray(value)) {
      if (!value.length) return <p className="text-sm text-slate-500">No entries.</p>;
      return (
        <div className="space-y-3">
          {value.map((row, index) => (
            <div key={index} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-bold uppercase text-slate-500">Entry {index + 1}</p>
              <dl className="grid gap-2 text-sm md:grid-cols-2">
                {Object.entries(row || {}).map(([key, item]) => (
                  <div key={key}>
                    <dt className="text-slate-500">{label(key)}</dt>
                    <dd className="font-medium text-academic-ink">{displayValue(item)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      );
    }

    if (value && typeof value === "object") {
      return (
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          {Object.entries(value).map(([key, item]) => (
            <div key={key}>
              <dt className="text-slate-500">{label(key)}</dt>
              <dd className="font-medium text-academic-ink">{displayValue(item)}</dd>
            </div>
          ))}
        </dl>
      );
    }

    return <p className="text-sm font-medium text-academic-ink">{displayValue(value)}</p>;
  };

  const renderReviewModal = () => {
    if (!viewing) return null;
    const sections = viewing.scores?.sections || {};

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-lg bg-white shadow-xl">
          <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white p-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-academic-teal">HOD Appraisal Review</p>
              <h3 className="mt-1 text-2xl font-bold text-academic-ink">{viewing.userId?.name || viewing.faculty?.name || "Faculty Appraisal"}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>{viewing.userId?.facultyId || viewing.faculty?.facultyId || "-"}</span>
                <span>{viewing.department}</span>
                <span>{viewing.academicYear}</span>
                <StatusBadge status={viewing.status} />
              </div>
            </div>
            <button type="button" className="btn-secondary" onClick={() => setViewing(null)}>Close</button>
          </div>

          <div className="space-y-6 p-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Final Normalized Score</p>
                <p className="mt-2 text-3xl font-black text-academic-teal">{viewing.scores?.normalizedTotal ?? viewing.scores?.total ?? 0}/100</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Submitted</p>
                <p className="mt-2 font-semibold text-academic-ink">{formatDate(getSubmittedAt(viewing))}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">HOD Review</p>
                <p className="mt-2 font-semibold text-academic-ink">{formatDate(viewing.hodReviewedAt)}</p>
              </div>
            </div>

            <section className="rounded-lg border border-slate-200 p-4">
              <h4 className="mb-3 text-lg font-bold text-academic-ink">Faculty Details</h4>
              {renderValue(viewing.parts?.partA?.generalInfo || {})}
            </section>

            <section className="rounded-lg border border-slate-200 p-4">
              <h4 className="mb-3 text-lg font-bold text-academic-ink">Section Totals</h4>
              <div className="grid gap-2 md:grid-cols-2">
                {Object.entries(sectionTitles).map(([key, title]) => (
                  <div key={key} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium">{title}</span>
                    <span className="font-black text-academic-teal">{sections[key] ?? 0}/{sectionMax[key]}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-academic-leaf">
                Raw Total: {viewing.scores?.rawTotal ?? 0}/{viewing.scores?.maxTotal ?? 100} | Normalized Score: {viewing.scores?.normalizedTotal ?? viewing.scores?.total ?? 0}/100
              </p>
            </section>

            {Object.entries(sectionTitles).map(([sectionKey, title]) => (
              <section key={sectionKey} className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-3 text-lg font-bold text-academic-ink">{title}</h4>
                <div className="space-y-4">
                  {Object.entries(viewing.parts?.[sectionKey] || {}).map(([key, value]) => (
                    <div key={key}>
                      <h5 className="mb-2 font-semibold text-slate-700">{label(key)}</h5>
                      {renderValue(value)}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <section className="rounded-lg border border-slate-200 p-4">
              <h4 className="mb-3 text-lg font-bold text-academic-ink">Uploaded Proofs / Documents</h4>
              {viewing.proofs?.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {viewing.proofs.map((proof) => (
                    <div key={proof._id || proof.filename} className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <FileText className="mt-0.5 text-academic-teal" size={18} />
                      <div>
                        <p className="font-semibold text-academic-ink">{proof.originalName || proof.filename}</p>
                        <p className="text-xs text-slate-500">{proof.mimetype || "Document"} | Uploaded {formatDate(proof.uploadedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No proof documents uploaded.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="HOD Dashboard" subtitle="Review submitted appraisals from your department only.">
      <section id="dashboard-overview" className="mb-8 scroll-mt-28 rounded-lg bg-gradient-to-r from-academic-navy to-academic-leaf p-6 text-white shadow-glass">
        <span id="profile-panel" className="block scroll-mt-28" />
        <p className="text-sm text-emerald-100">Department Authority</p>
        <h2 className="mt-1 text-2xl font-bold">{user.name}</h2>
        <p className="mt-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">HOD, {user.department}</p>
      </section>

      <div className="grid gap-5 md:grid-cols-4">
        <MetricCard title="Faculty in Department" value={faculty.length} />
        <MetricCard title="Submitted" value={appraisals.filter((a) => a.status === "submitted").length} accent="bg-academic-blue" />
        <MetricCard title="Approved" value={appraisals.filter((a) => a.status === "hod_approved").length} accent="bg-emerald-500" />
        <MetricCard title="Returned / Rejected" value={appraisals.filter((a) => ["returned_for_edit", "rejected"].includes(a.status)).length} accent="bg-rose-500" />
      </div>

      <section id="department-faculty" className="mt-8 scroll-mt-28 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-xl font-bold text-academic-ink">{user.department} Faculty List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Faculty Name</th>
                <th className="px-4 py-3">Faculty ID</th>
                <th className="px-4 py-3">Submission Status</th>
                <th className="px-4 py-3">Submitted Date</th>
                <th className="px-4 py-3">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {faculty.map((member) => (
                <tr key={member._id}>
                  <td className="px-4 py-3 font-medium">{member.name}</td>
                  <td className="px-4 py-3">{member.facultyId || "-"}</td>
                  <td className="px-4 py-3">{member.latestAppraisal ? "Started" : "Not started"}</td>
                  <td className="px-4 py-3">{getSubmittedAt(member.latestAppraisal) ? new Date(getSubmittedAt(member.latestAppraisal)).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={member.latestAppraisal?.status || "draft"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="faculty-submissions" className="mt-8 scroll-mt-28">
        <span id="pending-reviews" className="block scroll-mt-28" />
        <span id="approved-forms" className="block scroll-mt-28" />
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-academic-ink">Department Appraisals</h2>
          {loading && <span className="inline-flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading appraisals...</span>}
        </div>
        {message && (
          <p className={`mb-4 rounded-md px-3 py-2 text-sm ${message.toLowerCase().includes("failed") || message.toLowerCase().includes("unable") || message.toLowerCase().includes("required") ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-700"}`}>
            {message}
          </p>
        )}
        <AppraisalTable
          appraisals={appraisals}
          showSubmittedOn
          actions={(item) => (
            <div className="min-w-64 space-y-2">
              {item.status === "submitted" ? (
                <>
                  <textarea
                    className="input min-h-16"
                    placeholder="HOD remarks / reason"
                    value={remarks[item._id] || ""}
                    onChange={(e) => setRemarks({ ...remarks, [item._id]: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-secondary px-3 py-1.5" disabled={Boolean(busyId) || viewLoading} onClick={() => openReview(item)}>
                      {viewLoading ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />} {viewLoading ? "Loading appraisal..." : "View"}
                    </button>
                    <button className="btn-primary px-3 py-1.5" disabled={Boolean(busyId)} onClick={() => requestAction(item, "approve")}>
                      {busyId === `${item._id}:approve` ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {busyId === `${item._id}:approve` ? "Approving..." : "Approve"}
                    </button>
                    <button className="btn-secondary px-3 py-1.5" disabled={Boolean(busyId)} onClick={() => requestAction(item, "return")}>
                      {busyId === `${item._id}:return` ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />} {busyId === `${item._id}:return` ? "Returning..." : "Return"}
                    </button>
                    <button className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={Boolean(busyId)} onClick={() => requestAction(item, "reject")}>
                      {busyId === `${item._id}:reject` ? <Loader2 size={15} className="inline animate-spin" /> : <X size={15} className="inline" />} {busyId === `${item._id}:reject` ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button className="btn-secondary px-3 py-1.5" disabled={viewLoading} onClick={() => openReview(item)}>
                    <Eye size={15} /> View
                  </button>
                  <span className="text-xs text-slate-500">Reviewed by HOD</span>
                </div>
              )}
            </div>
          )}
        />
      </section>

      {renderReviewModal()}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-academic-ink">{actionLabel(confirmAction.type)} appraisal?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will update the appraisal status in MongoDB
              {confirmAction.type === "approve" ? " and send it to the Principal workflow." : " and notify the faculty."}
            </p>
            <label className="mt-4 block">
              <span className="label">{confirmAction.type === "reject" ? "Rejection reason" : "HOD remarks"}</span>
              <textarea
                className="input mt-1 min-h-24"
                value={remarks[confirmAction.item._id] || ""}
                onChange={(event) => {
                  setRemarks({ ...remarks, [confirmAction.item._id]: event.target.value });
                  if (confirmAction.error) setConfirmAction({ ...confirmAction, error: "" });
                }}
                placeholder={confirmAction.type === "approve" ? "Optional approval remarks" : "Required remarks / reason"}
              />
            </label>
            {confirmAction.error && <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{confirmAction.error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn-secondary" disabled={Boolean(busyId)} onClick={() => setConfirmAction(null)}>Cancel</button>
              <button type="button" className={confirmAction.type === "reject" ? "rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" : "btn-primary"} disabled={Boolean(busyId)} onClick={runAction}>
                {busyId ? <Loader2 size={18} className="animate-spin" /> : null} {busyId ? progressLabel(confirmAction.type) : `Confirm ${actionLabel(confirmAction.type)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
