"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { useLoading } from "@/context/LoadingContext";

export const metadata = {
  title: "Login | Lotto-App",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { showLoading, hideLoading } = useLoading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    try {
      showLoading();
      const res = await apiClient.login(email, password);
      localStorage.setItem("token", res.token);
      router.replace("/Home");
    } catch (err) {
      setError(err.message || "เข้าสู่ระบบล้มเหลว");
    } finally {
      hideLoading();
    }
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center from-indigo-900 via-sky-800 to-emerald-700 px-4 py-10 text-white">
      {/* decorative lottery balls */}
    

      {/* Glass card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white/10 p-8 backdrop-blur-lg ring-1 ring-white/20 shadow-2xl">
        <h1 className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold tracking-wide">
          <Lock className="h-6 w-6" /> เข้าสู่ระบบ Lotto-App
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-emerald-200">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-transparent bg-white/20 py-2 px-4 text-white placeholder-slate-300 outline-none transition focus:border-emerald-400 focus:bg-white/30 focus:ring-2 focus:ring-emerald-400/50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-emerald-200">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-transparent bg-white/20 py-2 px-4 text-white placeholder-slate-300 outline-none transition focus:border-emerald-400 focus:bg-white/30 focus:ring-2 focus:ring-emerald-400/50"
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 py-2 font-semibold text-white shadow-lg transition hover:bg-emerald-600 active:scale-95"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </section>
  );
}
