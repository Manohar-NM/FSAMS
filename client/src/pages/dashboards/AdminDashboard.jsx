import React from "react";
import { Eye, EyeOff, KeyRound, Search, Upload, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import MetricCard from "../../components/MetricCard";
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

export default function AdminDashboard() {
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
      await load();
    } catch (error) {
      setCreated({ message: getApiError(error) });
    }
  };

  const openResetPassword = (user) => {
    setResetTarget(user);
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

  const filteredUsers = users.filter((user) => {
    const haystack = `${user.name} ${user.email} ${user.role} ${user.department} ${user.facultyId || ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Create accounts, upload CSV users, and monitor system usage.">
      <div id="dashboard-overview" className="scroll-mt-28 grid gap-5 md:grid-cols-4">
        <MetricCard title="Users" value={users.length} />
        <MetricCard title="Faculty" value={stats.totalFaculties} accent="bg-academic-blue" />
        <MetricCard title="HODs" value={stats.totalHods} accent="bg-academic-gold" />
        <MetricCard title="Submissions" value={stats.totalSubmissions} accent="bg-academic-leaf" />
        <MetricCard title="Pending Reviews" value={stats.pendingReviews} accent="bg-academic-terracotta" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section id="create-users" className="glass scroll-mt-28 rounded-lg p-6">
          <h2 className="text-xl font-bold text-academic-ink">Create Account</h2>
          {created && (
            <div className={`mt-4 rounded-md p-3 text-sm ${created.emailSent === false ? "bg-amber-50 text-amber-800" : "bg-teal-50 text-teal-800"}`}>
              <p className="font-semibold">{created.message}</p>
            </div>
          )}
          <form onSubmit={createUser} className="mt-5 space-y-4">
            <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <div>
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
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="AIML">AIML</option>
              <option value="CIVIL">CIVIL</option>
              <option value="MECH">MECH</option>
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
              <button
                className="absolute right-3 top-2.5 text-slate-500"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
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
              <button
                className="absolute right-3 top-2.5 text-slate-500"
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </label>
            {formError && <p className="text-sm font-semibold text-red-600">{formError}</p>}
            <button className="btn-primary w-full"><UserPlus size={18} /> Create User</button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="font-semibold">CSV Bulk Upload</h3>
            <p className="mt-1 text-sm text-slate-500">Columns: name, email, role, department, password</p>
            <input className="input mt-3" type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />
            <button className="btn-secondary mt-3 w-full" onClick={bulkUpload}><Upload size={18} /> Upload CSV</button>
          </div>
        </section>

        <section id="manage-users" className="scroll-mt-28 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <h2 id="departments" className="scroll-mt-28 text-xl font-bold text-academic-ink">Users</h2>
            <label className="relative mt-3 block">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
              <input className="input pl-9" placeholder="Search by name, email, role, department, ID" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            {resetTarget && (
              <form onSubmit={resetPassword} className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">Update password for {resetTarget.name}</p>
                  <button className="text-sm font-semibold text-slate-500" type="button" onClick={() => setResetTarget(null)}>
                    Cancel
                  </button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
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
                    <button
                      className="absolute right-3 top-2.5 text-slate-500"
                      type="button"
                      onClick={() => setShowResetPassword((value) => !value)}
                      aria-label={showResetPassword ? "Hide new password" : "Show new password"}
                    >
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
                    <button
                      className="absolute right-3 top-2.5 text-slate-500"
                      type="button"
                      onClick={() => setShowResetConfirmPassword((value) => !value)}
                      aria-label={showResetConfirmPassword ? "Hide confirm new password" : "Show confirm new password"}
                    >
                      {showResetConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </label>
                </div>
                {resetError && <p className="mt-2 text-sm font-semibold text-red-600">{resetError}</p>}
                <button className="btn-primary mt-3"><KeyRound size={18} /> Update Password</button>
              </form>
            )}
          </div>
          <div id="reports" className="scroll-mt-28 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.facultyId || "-"}</td>
                    <td className="px-4 py-3 capitalize">{user.role}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-academic-leaf">{user.department}</span></td>
                    <td className="px-4 py-3">{user.designation || "-"}</td>
                    <td className="px-4 py-3">{user.isActive ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      <button className="btn-secondary px-3 py-1.5" onClick={() => openResetPassword(user)}>
                        <KeyRound size={15} /> Reset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
