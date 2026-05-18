import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  FileCheck2,
  FilePlus2,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserPlus,
  UserRound,
  UserRoundCheck,
  UsersRound,
  X
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../context/AuthContext";

const roleRoutes = {
  faculty: "/faculty",
  hod: "/hod",
  principal: "/principal",
  admin: "/admin"
};

const roleLabels = {
  faculty: "Faculty",
  hod: "HOD",
  principal: "Principal",
  admin: "Administrator"
};

const sidebarConfig = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, section: "dashboard-overview" },
    { label: "Create Users", icon: UserPlus, section: "create-users" },
    { label: "Manage Users", icon: UsersRound, section: "manage-users" },
    { label: "Departments", icon: Building2, section: "departments" },
    { label: "Notifications", icon: Bell, event: "fsams:open-notifications" },
    { label: "Reports", icon: FileBarChart, section: "reports" },
    { label: "Settings", icon: Settings, section: "dashboard-overview" },
    { label: "Logout", icon: LogOut, action: "logout" }
  ],
  faculty: [
    { label: "Dashboard", icon: LayoutDashboard, section: "dashboard-overview" },
    { label: "New Appraisal", icon: FilePlus2, event: "fsams:new-appraisal" },
    { label: "My Appraisals", icon: ClipboardList, section: "my-appraisals" },
    { label: "Notifications", icon: Bell, event: "fsams:open-notifications" },
    { label: "Profile", icon: UserRound, section: "profile-panel" },
    { label: "Help", icon: HelpCircle, section: "appraisal-workflow" },
    { label: "Logout", icon: LogOut, action: "logout" }
  ],
  hod: [
    { label: "Dashboard", icon: LayoutDashboard, section: "dashboard-overview" },
    { label: "Faculty Submissions", icon: ClipboardList, section: "faculty-submissions" },
    { label: "Pending Reviews", icon: ClipboardCheck, section: "pending-reviews" },
    { label: "Approved Forms", icon: FileCheck2, section: "approved-forms" },
    { label: "Notifications", icon: Bell, event: "fsams:open-notifications" },
    { label: "Department Faculty", icon: UsersRound, section: "department-faculty" },
    { label: "Profile", icon: UserRoundCheck, section: "profile-panel" },
    { label: "Logout", icon: LogOut, action: "logout" }
  ],
  principal: [
    { label: "Dashboard", icon: LayoutDashboard, section: "dashboard-overview" },
    { label: "Department Reviews", icon: Building2, section: "department-reviews" },
    { label: "Final Approvals", icon: ShieldCheck, section: "final-approvals" },
    { label: "Reports", icon: FileBarChart, section: "dashboard-overview" },
    { label: "Notifications", icon: Bell, event: "fsams:open-notifications" },
    { label: "Profile", icon: UserRound, section: "dashboard-overview" },
    { label: "Logout", icon: LogOut, action: "logout" }
  ]
};

const roleIcon = {
  faculty: FileText,
  hod: UserRoundCheck,
  principal: ShieldCheck,
  admin: BarChart3
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "AI";

const scrollToSection = (section) => {
  window.requestAnimationFrame(() => {
    const target = document.getElementById(section);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

export default function DashboardLayout({ title, subtitle, headerAction, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard-overview");
  const Icon = roleIcon[user.role] || GraduationCap;
  const items = sidebarConfig[user.role] || sidebarConfig.faculty;
  const baseRoute = roleRoutes[user.role] || "/dashboard";

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash) {
      setActiveSection(hash);
      scrollToSection(hash);
    }
  }, [location.hash]);

  useEffect(() => {
    const sectionIds = items.map((item) => item.section).filter(Boolean);
    if (!sectionIds.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0.05, 0.15, 0.3] }
    );

    sectionIds.forEach((id) => {
      const target = document.getElementById(id);
      if (target) observer.observe(target);
    });

    return () => observer.disconnect();
  }, [items]);

  const handleNav = (item) => {
    if (item.action === "logout") {
      logout();
      return;
    }

    if (item.event) {
      window.dispatchEvent(new Event(item.event));
      setActiveSection(item.section || item.event);
    }

    if (item.section) {
      setActiveSection(item.section);
      if (location.pathname !== baseRoute) {
        navigate(`${baseRoute}#${item.section}`);
      } else {
        window.history.replaceState(null, "", `#${item.section}`);
        scrollToSection(item.section);
      }
    }

    setMobileOpen(false);
  };

  const navMarkup = useMemo(
    () => (
      <nav className="mt-8 space-y-1.5">
        {items.map((item) => {
          const ItemIcon = item.icon;
          const active = item.section ? activeSection === item.section : activeSection === item.event;
          const isLogout = item.action === "logout";
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNav(item)}
              className={`group flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-semibold transition duration-200 ${
                active
                  ? "bg-white/18 text-white shadow-[0_12px_34px_rgba(16,185,129,0.18)] ring-1 ring-white/20"
                  : isLogout
                    ? "text-emerald-50/90 hover:bg-rose-500/15 hover:text-white"
                    : "text-emerald-50/86 hover:bg-white/12 hover:text-white"
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-md transition ${
                  active ? "bg-emerald-300/20 text-emerald-100" : "bg-white/8 text-emerald-100/90 group-hover:bg-white/14"
                }`}
              >
                <ItemIcon size={18} />
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {active && <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]" />}
            </button>
          );
        })}
      </nav>
    ),
    [activeSection, items]
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 overflow-hidden text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center blur-[1.5px]"
          style={{ backgroundImage: "url('/images/aiet-campus-hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,44,34,0.96),rgba(3,55,44,0.9)_42%,rgba(2,28,24,0.98))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(110,231,183,0.22),transparent_32%),linear-gradient(90deg,rgba(255,255,255,0.08),transparent_48%)]" />

        <div className="relative flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <button type="button" onClick={() => handleNav({ section: "dashboard-overview" })} className="flex min-w-0 items-center gap-3 text-left">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-white/20 bg-white/12 shadow-glass backdrop-blur">
                <Icon size={23} />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-black tracking-wide">FSAMS / FAA</span>
                <span className="block truncate text-xs font-semibold text-emerald-100/80">AIET Portal</span>
              </span>
            </button>
            <button type="button" className="rounded-md bg-white/10 p-2 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close sidebar">
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 rounded-md border border-white/14 bg-white/10 p-4 shadow-glass backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-academic-teal">
                {getInitials(user.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{user.name}</span>
                <span className="block truncate text-xs text-emerald-50/75">{user.email}</span>
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-300/16 px-3 py-1 text-xs font-bold text-emerald-50 ring-1 ring-emerald-200/20">
                {roleLabels[user.role] || user.role}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-50/85 ring-1 ring-white/10">
                {user.department}
              </span>
            </div>
          </div>

          {navMarkup}

          <div className="mt-auto rounded-md border border-white/10 bg-black/16 px-4 py-3 text-xs text-emerald-50/70 backdrop-blur">
            <p className="font-semibold text-emerald-50">Alva's Institute of Engineering & Technology</p>
            <p className="mt-1">Premium institutional appraisal workflow.</p>
          </div>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 px-4 py-3 shadow-sm backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-academic-ink shadow-sm transition hover:border-academic-teal/30 hover:text-academic-teal lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-academic-teal">Welcome back, {user.name}</p>
                <h1 className="truncate text-xl font-black text-academic-ink md:text-2xl">{title}</h1>
                <p className="hidden text-sm text-slate-500 sm:block">{subtitle}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {headerAction}
              <NotificationBell />
              <div className="hidden items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm md:flex">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-50 text-xs font-black text-academic-teal">
                  {getInitials(user.name)}
                </span>
                <span>
                  <span className="block max-w-40 truncate text-sm font-bold text-academic-ink">{user.name}</span>
                  <span className="block text-xs font-semibold uppercase text-slate-500">{roleLabels[user.role] || user.role}</span>
                </span>
              </div>
            </div>
          </div>
        </header>
        <section className="p-5 md:p-8">{children}</section>
      </main>
    </div>
  );
}
