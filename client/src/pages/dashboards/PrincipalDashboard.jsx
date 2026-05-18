import React from "react";
import { Eye, PenLine, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import AppraisalTable from "../../components/AppraisalTable";
import MetricCard from "../../components/MetricCard";
import DashboardLayout from "../../layouts/DashboardLayout";

export default function PrincipalDashboard() {
  const [appraisals, setAppraisals] = useState([]);
  const [departments, setDepartments] = useState(["CSE"]);
  const [hods, setHods] = useState([]);
  const [department, setDepartment] = useState("CSE");
  const [selectedHod, setSelectedHod] = useState(null);
  const [remarks, setRemarks] = useState({});

  const load = async (dept = department, hod = selectedHod) => {
    const params = new URLSearchParams();
    if (dept) params.set("department", dept);
    if (hod?._id) params.set("hodId", hod._id);
    const { data } = await api.get(`/appraisals/principal?${params.toString()}`);
    setAppraisals(data.appraisals);
  };

  useEffect(() => {
    api.get("/users/principal/directory").then(({ data }) => {
      setDepartments(data.departments);
      setHods(data.hods);
      setDepartment(data.departments[0] || "CSE");
    });
  }, []);

  useEffect(() => {
    load(department, selectedHod);
  }, [department, selectedHod]);

  const saveRemarks = async (item) => {
    await api.patch(`/appraisals/${item._id}/principal-remarks`, { remarks: remarks[item._id] || item.remarks?.principal || "" });
    await load();
  };

  return (
    <DashboardLayout title="Principal Dashboard" subtitle="View HOD-approved appraisals and record final remarks.">
      <div id="dashboard-overview" className="scroll-mt-28 grid gap-5 md:grid-cols-3">
        <MetricCard title="HOD Approved" value={appraisals.filter((a) => a.status === "hod_approved").length} />
        <MetricCard title="Final Reviewed" value={appraisals.filter((a) => a.status === "final_reviewed").length} accent="bg-academic-gold" />
        <MetricCard title="Departments" value={new Set(appraisals.map((a) => a.department)).size} accent="bg-academic-blue" />
      </div>

      <section id="department-reviews" className="mt-8 scroll-mt-28 rounded-lg border border-slate-200 bg-white p-5">
        <label className="block max-w-sm">
          <span className="label">Department</span>
          <select className="input mt-1" value={department} onChange={(e) => { setDepartment(e.target.value); setSelectedHod(null); }}>
            {departments.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {hods.filter((hod) => hod.department === department).map((hod) => (
            <button
              key={hod._id}
              className={`rounded-lg border p-4 text-left transition ${selectedHod?._id === hod._id ? "border-academic-teal bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              onClick={() => setSelectedHod(hod)}
            >
              <UserRoundCheck className="mb-3 text-academic-teal" />
              <p className="font-bold text-academic-ink">{hod.name}</p>
              <p className="text-sm text-slate-500">{hod.designation || "HOD"}, {hod.department}</p>
              <p className="mt-2 text-xs text-slate-400">{hod.email}</p>
            </button>
          ))}
          {!hods.filter((hod) => hod.department === department).length && (
            <p className="text-sm text-slate-500">No HOD account found for {department}.</p>
          )}
        </div>
      </section>

      <section id="final-approvals" className="mt-8 scroll-mt-28">
        <h2 className="mb-4 text-xl font-bold text-academic-ink">
          Final Review Queue {selectedHod ? `from ${selectedHod.name}` : `for ${department}`}
        </h2>
        <AppraisalTable
          appraisals={appraisals}
          actions={(item) => (
            <div className="min-w-64 space-y-2">
              <button className="btn-secondary px-3 py-1.5"><Eye size={15} /> View Scores: {item.scores?.total || 0}</button>
              <textarea
                className="input min-h-16"
                placeholder="Principal remarks"
                defaultValue={item.remarks?.principal || ""}
                onChange={(e) => setRemarks({ ...remarks, [item._id]: e.target.value })}
              />
              <button className="btn-primary px-3 py-1.5" onClick={() => saveRemarks(item)}>
                <PenLine size={15} /> Save Final Remarks
              </button>
            </div>
          )}
        />
      </section>
    </DashboardLayout>
  );
}
