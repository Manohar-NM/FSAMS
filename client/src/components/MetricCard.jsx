import React from "react";

export default function MetricCard({ title, value, accent = "bg-academic-teal" }) {
  return (
    <div className="glass rounded-lg p-5">
      <div className={`mb-4 h-1.5 w-14 rounded-full ${accent}`} />
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-academic-ink">{value}</p>
    </div>
  );
}
