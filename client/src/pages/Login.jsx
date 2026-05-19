import React, { useEffect } from "react";
import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/health", { timeout: 60000 }).catch(() => {});
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(form);
      navigate({ faculty: "/faculty", hod: "/hod", principal: "/principal", admin: "/admin" }[user.role]);
    } catch (err) {
      const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
      setError(
        err.response?.data?.message ||
          (isTimeout
            ? "The server is taking longer than usual to start. Please try signing in again."
            : err.message) ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-cover bg-center px-4" style={{ backgroundImage: "url('/images/aiet-official-banner.jpg')" }}>
      <div className="absolute inset-0 bg-gradient-to-r from-[#061c16]/88 via-[#16352f]/76 to-[#4f1e18]/62" />
      <form onSubmit={submit} className="glass relative w-full max-w-md rounded-lg p-8">
        <Link to="/" className="text-sm font-semibold text-academic-teal">FSAMS / FAA</Link>
        <h1 className="mt-4 text-3xl font-bold text-academic-ink">Portal Login</h1>
        <p className="mt-2 text-sm text-slate-500">Admin-created accounts only. Use your organization email.</p>
        {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="label">Email</span>
            <input className="input mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input className="input mt-1" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>
        </div>
        <button disabled={loading} className="btn-primary mt-6 w-full">
          <LockKeyhole size={18} /> {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
