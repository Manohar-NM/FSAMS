import React from "react";
import { BarChart3, FileText, LogOut, ShieldCheck, UserRoundCheck } from "lucide-react";
import { Link } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";

const roleIcon = {
  faculty: FileText,
  hod: UserRoundCheck,
  principal: ShieldCheck,
  admin: BarChart3
};

export default function DashboardLayout({ title, subtitle, headerAction, children }) {
  const { user, logout } = useAuth();
  const Icon = roleIcon[user.role] || FileText;

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/20 bg-academic-navy text-white lg:block">
        <div className="flex h-full flex-col p-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-white/10">
              <Icon size={22} />
            </span>
            <span>
              <span className="block text-sm font-semibold">FSAMS / FAA</span>
              <span className="text-xs text-slate-300">AIET Portal</span>
            </span>
          </Link>
          <nav className="mt-10 space-y-2 text-sm">
            <span className="block rounded-md bg-white/10 px-4 py-3">Dashboard</span>
            <span className="block rounded-md px-4 py-3 text-slate-300">Department: {user.department}</span>
            <span className="block rounded-md px-4 py-3 text-slate-300">Role: {user.role}</span>
          </nav>
          <button onClick={logout} className="mt-auto flex items-center gap-2 rounded-md px-4 py-3 text-sm text-slate-200 hover:bg-white/10">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-academic-teal">Alva's Institute of Engineering & Technology</p>
              <h1 className="text-2xl font-bold text-academic-ink">{title}</h1>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              {headerAction}
              <NotificationBell />
              <div className="rounded-md bg-slate-100 px-4 py-2 text-sm">
                <b>{user.name}</b>
                <span className="block text-slate-500">{user.email}</span>
              </div>
            </div>
          </div>
        </header>
        <section className="p-5 md:p-8">{children}</section>
      </main>
    </div>
  );
}
