import React from "react";
import StatusBadge from "./StatusBadge";

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

export default function AppraisalTable({ appraisals, actions, mode = "default", showSubmittedOn = false }) {
  if (mode === "faculty") {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Academic Year</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Final Score</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appraisals.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{item.academicYear}</td>
                  <td className="px-4 py-3">{item.semester || "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3">{item.scores?.normalizedTotal ?? item.scores?.total ?? 0}</td>
                  <td className="px-4 py-3">{actions?.(item)}</td>
                </tr>
              ))}
              {!appraisals.length && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-500">No appraisals found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Faculty</th>
              <th className="px-4 py-3">Faculty ID</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Academic Year</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              {showSubmittedOn && <th className="px-4 py-3">Submitted On</th>}
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appraisals.map((item) => (
              <tr key={item._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{item.userId?.name || item.faculty?.name || "Self"}</td>
                <td className="px-4 py-3">{item.userId?.facultyId || item.faculty?.facultyId || "-"}</td>
                <td className="px-4 py-3">{item.department}</td>
                <td className="px-4 py-3">{item.academicYear}</td>
                <td className="px-4 py-3">{item.scores?.total ?? 0}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                {showSubmittedOn && <td className="px-4 py-3 whitespace-nowrap">{formatSubmittedOn(item.submitted_at || item.submittedAt)}</td>}
                <td className="px-4 py-3">{actions?.(item)}</td>
              </tr>
            ))}
            {!appraisals.length && (
              <tr>
                <td colSpan={showSubmittedOn ? 8 : 7} className="px-4 py-8 text-center text-slate-500">No appraisals found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
