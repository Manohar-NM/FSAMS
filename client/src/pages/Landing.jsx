import React from "react";
import { ArrowRight, Building2, CheckCircle2, FileCheck2, LockKeyhole, Route } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  "Role-based institutional workflow",
  "Automated appraisal score calculation",
  "Department-isolated HOD review",
  "Locked forms after faculty submission",
  "Professional PDF appraisal reports",
  "Admin-only account provisioning"
];

export default function Landing() {
  return (
    <main className="bg-academic-cream text-slate-900">
      <section
        className="relative min-h-screen overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/images/aiet-official-banner.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#061c16]/95 via-[#16352f]/72 to-[#4f1e18]/36" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-academic-cream to-transparent" />
        <div className="relative flex min-h-screen max-w-7xl flex-col justify-center px-6 py-24 text-white md:px-10">
          <p className="mb-5 w-fit rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
            Alva's Institute of Engineering & Technology
          </p>
          <h1 className="max-w-5xl text-4xl font-black leading-tight drop-shadow-xl md:text-6xl">
            FACULTY SELF APPRAISAL MANAGEMENT SYSTEM
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-200 md:text-2xl">
            Digitizing Faculty Performance Evaluation and Workflow Management
          </p>
          <Link to="/login" className="btn-primary mt-9 w-fit bg-academic-gold text-academic-ink hover:bg-yellow-500">
            Login to Portal <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="bg-academic-navy px-6 py-20 text-white md:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2">
          <div>
            <Building2 className="mb-5 text-academic-gold" size={34} />
            <h2 className="text-3xl font-bold">About College</h2>
            <p className="mt-5 text-slate-300">
              Alva's Institute of Engineering & Technology advances academic excellence through accredited programmes,
              NAAC and NBA quality practices, outcome-focused teaching, research culture, and institutional digital transformation.
            </p>
          </div>
          <div className="glass-dark rounded-lg border-academic-gold/30 p-6">
            <h2 className="text-3xl font-bold">About FAA System</h2>
            <p className="mt-5 text-slate-300">
              FSAMS digitizes faculty self appraisal from draft creation to HOD review and principal final remarks,
              keeping score calculation, status movement, PDF records, and access boundaries consistent across departments.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-10">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-academic-ink">Features</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="rounded-lg border border-emerald-900/10 bg-white p-5 shadow-sm">
                <CheckCircle2 className="mb-4 text-academic-leaf" />
                <p className="font-semibold">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative bg-cover bg-center px-6 py-20 md:px-10"
        style={{ backgroundImage: "url('/images/aiet-campus-hero.jpg')" }}
      >
        <div className="absolute inset-0 bg-academic-ink/82" />
        <div className="relative mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold text-white">Workflow Overview</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {["Faculty Draft", "Submit & Lock", "HOD Review", "Principal Remarks", "Final PDF"].map((step, index) => (
              <div key={step} className="rounded-lg border border-white/15 bg-white/90 p-5 shadow-sm backdrop-blur">
                <Route className="mb-3 text-academic-terracotta" />
                <span className="text-xs font-bold text-academic-teal">STEP {index + 1}</span>
                <p className="mt-2 font-semibold text-academic-ink">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#12211c] px-6 py-16 text-center text-white md:px-10">
        <FileCheck2 className="mx-auto mb-4 text-academic-gold" size={36} />
        <h2 className="text-3xl font-bold">Ready for digital appraisal review</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">Secure, role-based, and aligned to the institutional FAA process.</p>
        <Link to="/login" className="btn-primary mt-7 bg-white text-academic-ink hover:bg-slate-100">
          <LockKeyhole size={18} /> Login
        </Link>
      </section>
    </main>
  );
}
