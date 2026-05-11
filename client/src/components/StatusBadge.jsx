import React from "react";

const styles = {
  draft: "bg-slate-100 text-slate-700",
  submitted: "bg-blue-100 text-blue-700",
  returned_for_edit: "bg-amber-100 text-amber-700",
  hod_approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  final_reviewed: "bg-indigo-100 text-indigo-700"
};

const labels = {
  draft: "Draft",
  submitted: "Submitted",
  returned_for_edit: "Returned",
  hod_approved: "Approved by HOD",
  rejected: "Rejected",
  final_reviewed: "Finalized"
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.draft}`}>
      {labels[status] || status?.replaceAll("_", " ")}
    </span>
  );
}
