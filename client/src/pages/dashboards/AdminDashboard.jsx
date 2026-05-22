import React, { useEffect, useMemo, useState } from "react";
import { Download, Eye, EyeOff, KeyRound, Search, Upload, UserPlus, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import MetricCard from "../../components/MetricCard";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../layouts/DashboardLayout";

const emptyForm = {
  name: "",
  email: "",
  role: "faculty",
  department: "CSE",
  facultyId: "",
  designation: "Assistant Professor",
  password: "",
  confirmPassword: ""
};

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

const departments = ["CSE", "ECE", "AIML", "CIVIL", "MECH"];

const validatePasswords = ({ password, confirmPassword }) => {
  if (!password.trim()) return "Password is required.";
  if (!confirmPassword.trim()) return "Confirm password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password !== confirmPassword) return "Passwords must match.";
  return "";
};

const getApiError = (error) =>
  error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || "Request failed. Please try again.";

const getEmailFormatError = (email) => {
  if (!email.trim()) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "" : "Invalid email format";
};

const roleTone = {
  admin: "bg-rose-50 text-rose-700 ring-rose-100",
  hod: "bg-blue-50 text-blue-700 ring-blue-100",
  principal: "bg-violet-50 text-violet-700 ring-violet-100",
  faculty: "bg-emerald-50 text-emerald-700 ring-emerald-100"
};

const Modal = ({ title, subtitle, children, onClose, width = "max-w-2xl" }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
    <section className={`max-h-[92vh] w-full ${width} overflow-y-auto rounded-lg bg-white shadow-2xl`}>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <h2 className="text-lg font-black text-academic-ink">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-academic-ink"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </section>
  </div>
);

const PageHeader = ({ eyebrow, title, description, action }) => (
  <div className="mb-5 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-xs font-black uppercase text-academic-teal">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-black text-academic-ink">{title}</h2>
      {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
    </div>
    {action}
  </div>
);

const Panel = ({ title, description, children }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h3 className="text-base font-black text-academic-ink">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
    {children}
  </section>
);

export default function AdminDashboard() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalFaculties: 0, totalHods: 0, totalSubmissions: 0, pendingReviews: 0 });
  const [created, setCreated] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });
  const [resetError, setResetError] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [emailValidation, setEmailValidation] = useState({ status: "idle", message: "" });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState("");
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordError, setPasswordError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showSettingsConfirmPassword, setShowSettingsConfirmPassword] = useState(false);

  const storedInstitution = JSON.parse(localStorage.getItem("fsams_institution_settings") || "{}");
  const [accountSettings, setAccountSettings] = useState({
    name: user.name || "",
    email: user.email || "",
    department: user.department || "CSE",
    designation: user.designation || "System Administrator"
  });
  const [institutionSettings, setInstitutionSettings] = useState({
    institutionName: storedInstitution.institutionName || "Alva's Institute of Engineering & Technology",
    portalName: storedInstitution.portalName || "FSAMS / FAA Portal",
    primaryDepartment: storedInstitution.primaryDepartment || user.department || "CSE",
    organizationDomain: storedInstitution.organizationDomain || "",
    adminDisplayName: storedInstitution.adminDisplayName || user.name || "",
    loginUrl: storedInstitution.loginUrl || window.location.origin
  });

  const activeView = location.pathname.replace("/admin", "").replace(/^\//, "") || "dashboard";

  const load = async () => {
    const { data } = await api.get("/users");
    setUsers(data.users);
    const statsResponse = await api.get("/users/stats");
    setStats(statsResponse.data);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const allowedViews = ["dashboard", "create-users", "users", "departments", "reports", "settings"];
    if (!allowedViews.includes(activeView)) navigate("/admin", { replace: true });
  }, [activeView, navigate]);

  useEffect(() => {
    const email = form.email.trim();
    const formatError = getEmailFormatError(email);

    if (!email) {
      setEmailValidation({ status: "idle", message: "" });
      return;
    }

    if (formatError) {
      setEmailValidation({ status: "error", message: formatError });
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setEmailValidation({ status: "checking", message: "Verifying email address..." });
      try {
        const { data } = await api.get("/users/validate-email", {
          params: { email },
          signal: controller.signal
        });
        setEmailValidation({ status: "valid", message: data.message || "Email address is valid" });
      } catch (error) {
        if (error.name === "CanceledError") return;
        setEmailValidation({ status: "error", message: getApiError(error) });
      }
    }, 700);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [form.email]);

  const filteredUsers = users.filter((member) => {
    const haystack = `${member.name} ${member.email} ${member.role} ${member.department} ${member.facultyId || ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const departmentRows = useMemo(
    () =>
      departments.map((department) => {
        const members = users.filter((member) => member.department === department);
        return {
          department,
          total: members.length,
          faculty: members.filter((member) => member.role === "faculty").length,
          hods: members.filter((member) => member.role === "hod").length,
          admins: members.filter((member) => member.role === "admin").length
        };
      }),
    [users]
  );

  const createUser = async (event) => {
    event.preventDefault();
    const validationMessage = validatePasswords(form);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    if (emailValidation.status === "checking") {
      setFormError("Email verification is still in progress.");
      return;
    }
    if (emailValidation.status === "error") {
      setFormError(emailValidation.message);
      return;
    }
    setFormError("");
    try {
      const { data } = await api.post("/users", form);
      setCreated(data);
      setForm(emptyForm);
      setEmailValidation({ status: "idle", message: "" });
      await load();
    } catch (error) {
      setCreated(null);
      setFormError(getApiError(error));
    }
  };

  const bulkUpload = async () => {
    if (!file) return;
    const payload = new FormData();
    payload.append("file", file);
    try {
      const { data } = await api.post("/users/bulk", payload);
      setCreated({ message: `Created ${data.created.length}, failed ${data.failed.length}`, bulk: data });
      setFile(null);
      setUploadOpen(false);
      await load();
    } catch (error) {
      setCreated({ message: getApiError(error) });
    }
  };

  const openResetPassword = (member) => {
    setResetTarget(member);
    setResetForm({ password: "", confirmPassword: "" });
    setResetError("");
    setCreated(null);
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    const validationMessage = validatePasswords(resetForm);
    if (validationMessage) {
      setResetError(validationMessage);
      return;
    }
    setResetError("");
    try {
      const { data } = await api.patch(`/users/${resetTarget._id}/reset-password`, resetForm);
      setCreated({ message: data.message });
      setResetTarget(null);
      setResetForm({ password: "", confirmPassword: "" });
    } catch (error) {
      setResetError(getApiError(error));
    }
  };

  const exportUsers = () => {
    const columns = ["name", "email", "role", "department", "facultyId", "designation", "isActive"];
    const rows = filteredUsers.map((member) =>
      columns
        .map((column) => `"${String(member[column] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [columns.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fsams-users.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveAccountSettings = (event) => {
    event.preventDefault();
    const updatedUser = { ...user, ...accountSettings };
    localStorage.setItem("fsams_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setSettingsSaved("Account settings saved for this browser session.");
  };

  const saveInstitutionSettings = (event) => {
    event.preventDefault();
    localStorage.setItem("fsams_institution_settings", JSON.stringify(institutionSettings));
    setSettingsSaved("Institution settings saved locally.");
  };

  const changeOwnPassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords must match.");
      return;
    }
    setPasswordError("");
    try {
      const { data } = await api.patch("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setSettingsSaved(data.message);
      setPasswordForm(emptyPasswordForm);
    } catch (error) {
      setPasswordError(getApiError(error));
    }
  };

  const renderCreateForm = (compact = false) => (
    <form onSubmit={createUser} className={`grid gap-4 ${compact ? "" : "lg:grid-cols-2"}`}>
      <input className={`input ${compact ? "" : "lg:col-span-2"}`} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <div className={compact ? "" : "lg:col-span-2"}>
        <input className="input" placeholder="Organization email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        {emailValidation.message && (
          <p
            className={`mt-1 text-sm font-semibold ${
              emailValidation.status === "valid"
                ? "text-teal-700"
                : emailValidation.status === "checking"
                  ? "text-slate-500"
                  : "text-red-600"
            }`}
          >
            {emailValidation.message}
          </p>
        )}
      </div>
      <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
        <option value="faculty">Faculty</option>
        <option value="hod">HOD</option>
        <option value="principal">Principal</option>
        <option value="admin">Admin</option>
      </select>
      <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
        {departments.map((department) => <option key={department} value={department}>{department}</option>)}
      </select>
      <input className="input" placeholder="Employee / Faculty ID" value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} />
      <input className="input" placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
      <label className="relative block">
        <input
          className="input pr-11"
          placeholder="Password"
          type={showPassword ? "text" : "password"}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={8}
          required
        />
        <button className="absolute right-3 top-2.5 text-slate-500" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </label>
      <label className="relative block">
        <input
          className="input pr-11"
          placeholder="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          minLength={8}
          required
        />
        <button className="absolute right-3 top-2.5 text-slate-500" type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </label>
      {formError && <p className={`text-sm font-semibold text-red-600 ${compact ? "" : "lg:col-span-2"}`}>{formError}</p>}
      <div className={compact ? "" : "lg:col-span-2"}>
        <button className="btn-primary w-full sm:w-auto"><UserPlus size={18} /> Create User</button>
      </div>
    </form>
  );

  const renderUserTable = () => (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:w-96">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
            <input className="input pl-9" placeholder="Search name, email, role, department, ID" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" type="button" onClick={() => navigate("/admin/create-users")}>
              <UserPlus size={18} /> Create
            </button>
            <button className="btn-secondary" type="button" onClick={() => setUploadOpen(true)}>
              <Upload size={18} /> Upload CSV
            </button>
            <button className="btn-secondary" type="button" onClick={exportUsers}>
              <Download size={18} /> Export
            </button>
          </div>
        </div>
        {created && (
          <div className={`mt-4 rounded-md p-3 text-sm ${created.emailSent === false ? "bg-amber-50 text-amber-800" : "bg-teal-50 text-teal-800"}`}>
            <p className="font-semibold">{created.message}</p>
          </div>
        )}
      </div>

      <div className="hidden md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Profile</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((member) => (
              <tr key={member._id} className="transition hover:bg-slate-50/80">
                <td className="px-5 py-4">
                  <p className="font-bold text-academic-ink">{member.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{member.facultyId || "No ID"} - {member.designation || "No designation"}</p>
                </td>
                <td className="px-5 py-4 text-slate-700">{member.email}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${roleTone[member.role] || "bg-slate-50 text-slate-700 ring-slate-100"}`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-academic-leaf">{member.department}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${member.isActive ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}>
                    {member.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button className="btn-secondary px-3 py-1.5" type="button" onClick={() => openResetPassword(member)}>
                    <KeyRound size={15} /> Reset
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {filteredUsers.map((member) => (
          <article key={member._id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-academic-ink">{member.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{member.email}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${roleTone[member.role] || "bg-slate-50 text-slate-700 ring-slate-100"}`}>
                {member.role}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-academic-leaf">{member.department}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{member.facultyId || "No ID"}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{member.designation || "No designation"}</span>
            </div>
            <button className="btn-secondary mt-4 w-full" type="button" onClick={() => openResetPassword(member)}>
              <KeyRound size={15} /> Reset Password
            </button>
          </article>
        ))}
      </div>
    </section>
  );

  const dashboardView = (
    <>
      <div id="dashboard-overview" className="scroll-mt-28 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Users" value={users.length} />
        <MetricCard title="Faculty" value={stats.totalFaculties} accent="bg-academic-blue" />
        <MetricCard title="HODs" value={stats.totalHods} accent="bg-academic-gold" />
        <MetricCard title="Submissions" value={stats.totalSubmissions} accent="bg-academic-leaf" />
        <MetricCard title="Pending Reviews" value={stats.pendingReviews} accent="bg-academic-terracotta" />
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-3">
        <button type="button" onClick={() => navigate("/admin/create-users")} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-academic-teal/40 hover:shadow-md">
          <UserPlus className="text-academic-teal" size={24} />
          <h3 className="mt-4 font-black text-academic-ink">Create users</h3>
          <p className="mt-1 text-sm text-slate-500">Add individual faculty, HOD, principal, and admin accounts.</p>
        </button>
        <button type="button" onClick={() => navigate("/admin/users")} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-academic-teal/40 hover:shadow-md">
          <Search className="text-academic-teal" size={24} />
          <h3 className="mt-4 font-black text-academic-ink">Manage users</h3>
          <p className="mt-1 text-sm text-slate-500">Search accounts, reset passwords, and export user records.</p>
        </button>
        <button type="button" onClick={() => navigate("/admin/settings")} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-academic-teal/40 hover:shadow-md">
          <KeyRound className="text-academic-teal" size={24} />
          <h3 className="mt-4 font-black text-academic-ink">Settings</h3>
          <p className="mt-1 text-sm text-slate-500">Update admin profile, password, and institution settings.</p>
        </button>
      </div>
    </>
  );

  const createUsersView = (
    <div id="create-users" className="scroll-mt-28">
      <PageHeader eyebrow="Account setup" title="Create Users" description="Create a single user account with role, department, ID, designation, and login password." />
      {created && (
        <div className={`mb-5 rounded-md p-3 text-sm ${created.emailSent === false ? "bg-amber-50 text-amber-800" : "bg-teal-50 text-teal-800"}`}>
          <p className="font-semibold">{created.message}</p>
        </div>
      )}
      <Panel title="New user account" description="The user can sign in immediately after this account is created.">
        {renderCreateForm()}
      </Panel>
    </div>
  );

  const usersView = (
    <div id="manage-users" className="scroll-mt-28">
      <PageHeader eyebrow="Directory" title="Manage Users" description={`${filteredUsers.length} of ${users.length} accounts shown.`} />
      {renderUserTable()}
    </div>
  );

  const departmentsView = (
    <div id="departments" className="scroll-mt-28">
      <PageHeader eyebrow="Institution structure" title="Departments" description="A quick operational view of departments and account distribution." />
      <div className="grid gap-4 lg:grid-cols-2">
        {departmentRows.map((row) => (
          <Panel key={row.department} title={row.department} description={`${row.total} total accounts`}>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-2xl font-black text-academic-ink">{row.faculty}</p>
                <p className="text-xs font-bold uppercase text-slate-500">Faculty</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-2xl font-black text-academic-ink">{row.hods}</p>
                <p className="text-xs font-bold uppercase text-slate-500">HODs</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-2xl font-black text-academic-ink">{row.admins}</p>
                <p className="text-xs font-bold uppercase text-slate-500">Admins</p>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );

  const reportsView = (
    <div id="reports" className="scroll-mt-28">
      <PageHeader
        eyebrow="Reports"
        title="Reports"
        description="Export user directories and keep account creation workflows separate from the main dashboard."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" type="button" onClick={() => setUploadOpen(true)}><Upload size={18} /> Upload CSV</button>
            <button className="btn-primary" type="button" onClick={exportUsers}><Download size={18} /> Export Users</button>
          </div>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="User directory" description="Export the currently filtered user list as a CSV file.">
          <button className="btn-primary w-full" type="button" onClick={exportUsers}><Download size={18} /> Export Users</button>
        </Panel>
        <Panel title="Bulk account upload" description="Create many accounts from a prepared CSV file.">
          <button className="btn-secondary w-full" type="button" onClick={() => setUploadOpen(true)}><Upload size={18} /> Upload CSV</button>
        </Panel>
        <Panel title="Review summary" description="Monitor submitted appraisals and pending reviews from the overview metrics.">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-2xl font-black text-academic-ink">{stats.totalSubmissions}</p>
              <p className="text-xs font-bold uppercase text-slate-500">Submissions</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-2xl font-black text-academic-ink">{stats.pendingReviews}</p>
              <p className="text-xs font-bold uppercase text-slate-500">Pending</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );

  const settingsView = (
    <div id="settings" className="scroll-mt-28">
      <PageHeader eyebrow="Portal control" title="Settings" description="Manage the administrator profile, password, institution identity, and portal defaults." />
      {settingsSaved && <div className="mb-5 rounded-md bg-teal-50 p-3 text-sm font-semibold text-teal-800">{settingsSaved}</div>}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Account Details" description="These details update the local admin profile shown in the dashboard.">
          <form onSubmit={saveAccountSettings} className="space-y-4">
            <input className="input" placeholder="Account name" value={accountSettings.name} onChange={(e) => setAccountSettings({ ...accountSettings, name: e.target.value })} />
            <input className="input" placeholder="Account email" type="email" value={accountSettings.email} onChange={(e) => setAccountSettings({ ...accountSettings, email: e.target.value })} />
            <select className="input" value={accountSettings.department} onChange={(e) => setAccountSettings({ ...accountSettings, department: e.target.value })}>
              {departments.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
            <input className="input" placeholder="Designation" value={accountSettings.designation} onChange={(e) => setAccountSettings({ ...accountSettings, designation: e.target.value })} />
            <button className="btn-primary" type="submit">Save Account</button>
          </form>
        </Panel>

        <Panel title="Password & Security" description="Change your own admin password. New password must be strong.">
          <form onSubmit={changeOwnPassword} className="space-y-4">
            <label className="relative block">
              <input className="input pr-11" placeholder="Current password" type={showCurrentPassword ? "text" : "password"} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
              <button className="absolute right-3 top-2.5 text-slate-500" type="button" onClick={() => setShowCurrentPassword((value) => !value)} aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}>
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
            <label className="relative block">
              <input className="input pr-11" placeholder="New password" type={showNewPassword ? "text" : "password"} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
              <button className="absolute right-3 top-2.5 text-slate-500" type="button" onClick={() => setShowNewPassword((value) => !value)} aria-label={showNewPassword ? "Hide new password" : "Show new password"}>
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
            <label className="relative block">
              <input className="input pr-11" placeholder="Confirm new password" type={showSettingsConfirmPassword ? "text" : "password"} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
              <button className="absolute right-3 top-2.5 text-slate-500" type="button" onClick={() => setShowSettingsConfirmPassword((value) => !value)} aria-label={showSettingsConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                {showSettingsConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
            {passwordError && <p className="text-sm font-semibold text-red-600">{passwordError}</p>}
            <button className="btn-primary" type="submit"><KeyRound size={18} /> Update Password</button>
          </form>
        </Panel>

        <Panel title="Institution Details" description="Use these values to keep the admin experience aligned with your college.">
          <form onSubmit={saveInstitutionSettings} className="space-y-4">
            <input className="input" placeholder="Institution name" value={institutionSettings.institutionName} onChange={(e) => setInstitutionSettings({ ...institutionSettings, institutionName: e.target.value })} />
            <input className="input" placeholder="Portal name" value={institutionSettings.portalName} onChange={(e) => setInstitutionSettings({ ...institutionSettings, portalName: e.target.value })} />
            <select className="input" value={institutionSettings.primaryDepartment} onChange={(e) => setInstitutionSettings({ ...institutionSettings, primaryDepartment: e.target.value })}>
              {departments.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
            <input className="input" placeholder="Organization email domain" value={institutionSettings.organizationDomain} onChange={(e) => setInstitutionSettings({ ...institutionSettings, organizationDomain: e.target.value })} />
            <input className="input" placeholder="Admin display name" value={institutionSettings.adminDisplayName} onChange={(e) => setInstitutionSettings({ ...institutionSettings, adminDisplayName: e.target.value })} />
            <input className="input" placeholder="Login URL" value={institutionSettings.loginUrl} onChange={(e) => setInstitutionSettings({ ...institutionSettings, loginUrl: e.target.value })} />
            <button className="btn-primary" type="submit">Save Institution</button>
          </form>
        </Panel>

        <Panel title="Portal Summary" description="A quick readout of the current admin configuration.">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="font-semibold text-slate-500">Admin</dt>
              <dd className="text-right font-bold text-academic-ink">{accountSettings.name}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="font-semibold text-slate-500">Institution</dt>
              <dd className="text-right font-bold text-academic-ink">{institutionSettings.institutionName}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="font-semibold text-slate-500">Primary department</dt>
              <dd className="text-right font-bold text-academic-ink">{institutionSettings.primaryDepartment}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-slate-500">Managed accounts</dt>
              <dd className="text-right font-bold text-academic-ink">{users.length}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );

  const viewMap = {
    dashboard: dashboardView,
    "create-users": createUsersView,
    users: usersView,
    departments: departmentsView,
    reports: reportsView,
    settings: settingsView
  };

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Create accounts, upload CSV users, and monitor system usage.">
      {viewMap[activeView] || dashboardView}

      {uploadOpen && (
        <Modal title="CSV Bulk Upload" subtitle="Upload a CSV file with user account details." onClose={() => setUploadOpen(false)} width="max-w-lg">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Required columns: <span className="font-bold text-slate-800">name, email, role, department, password</span>
          </div>
          <input className="input mt-4" type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button className="btn-secondary" type="button" onClick={() => setUploadOpen(false)}>Cancel</button>
            <button className="btn-primary" type="button" onClick={bulkUpload} disabled={!file}>
              <Upload size={18} /> Upload CSV
            </button>
          </div>
        </Modal>
      )}

      {resetTarget && (
        <Modal title="Reset Password" subtitle={`Update password for ${resetTarget.name}.`} onClose={() => setResetTarget(null)} width="max-w-lg">
          <form onSubmit={resetPassword} className="space-y-4">
            <label className="relative block">
              <input
                className="input pr-11"
                placeholder="New password"
                type={showResetPassword ? "text" : "password"}
                value={resetForm.password}
                onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                minLength={8}
                required
              />
              <button className="absolute right-3 top-2.5 text-slate-500" type="button" onClick={() => setShowResetPassword((value) => !value)} aria-label={showResetPassword ? "Hide new password" : "Show new password"}>
                {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
            <label className="relative block">
              <input
                className="input pr-11"
                placeholder="Confirm new password"
                type={showResetConfirmPassword ? "text" : "password"}
                value={resetForm.confirmPassword}
                onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                minLength={8}
                required
              />
              <button className="absolute right-3 top-2.5 text-slate-500" type="button" onClick={() => setShowResetConfirmPassword((value) => !value)} aria-label={showResetConfirmPassword ? "Hide confirm new password" : "Show confirm new password"}>
                {showResetConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
            {resetError && <p className="text-sm font-semibold text-red-600">{resetError}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="btn-secondary" type="button" onClick={() => setResetTarget(null)}>Cancel</button>
              <button className="btn-primary"><KeyRound size={18} /> Update Password</button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
