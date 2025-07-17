"use client";

import { useState, useEffect } from "react";
import { Plus, Ban, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { useLoading } from "@/context/LoadingContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";

interface BlacklistNumber {
  _id: string;
  number: string;
}

export default function BlacklistPage() {
  const [blacklist, setBlacklist] = useState<BlacklistNumber[]>([]);
  const [number, setNumber] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { showLoading, hideLoading } = useLoading();

  useAuthGuard();

  const fetchBlacklist = async () => {
    const token = getToken();
    if (!token) return;
    showLoading();
    try {
      const res = await apiClient.getBlacklist(token);
      setBlacklist(res.data);
    } catch (err) {
      console.error("โหลด blacklist ล้มเหลว", err);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const addOrUpdateNumber = async () => {
    const token = getToken();
    if (!token || !number.trim()) return;

    showLoading();
    try {
      if (editingId) {
        const res = await apiClient.updateBlacklist(editingId, { number }, token);
        setBlacklist((prev) =>
          prev.map((item) => (item._id === editingId ? res.data : item))
        );
        setEditingId(null);
      } else {
        const res = await apiClient.addBlacklist({ number }, token);
        setBlacklist((prev) => [...prev, res.data]);
      }

      setNumber("");
    } catch (err) {
      console.error("เพิ่ม/แก้ไขเลข blacklist ล้มเหลว", err);
    } finally {
      hideLoading();
    }
  };

  const removeNumber = async (id: string) => {
    const token = getToken();
    if (!token) return;

    showLoading();
    try {
      await apiClient.deleteBlacklist(id, token);
      setBlacklist((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("ลบเลข blacklist ล้มเหลว", err);
    } finally {
      hideLoading();
    }
  };

  const startEditing = (item: BlacklistNumber) => {
    setNumber(item.number);
    setEditingId(item._id);
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-sky-800/70 to-emerald-700 px-4 py-10 text-white">
      {/* Back */}
      <Link
        href="/Home"
        className="absolute left-6 top-6 rounded-lg bg-white/10 px-3 py-1 text-sm backdrop-blur-md transition hover:bg-white/20"
      >
        ← กลับหน้าเมนู
      </Link>

      {/* Card */}
      <div className="w-full max-w-2xl rounded-3xl bg-white/10 p-8 backdrop-blur-md shadow-xl ring-1 ring-white/15">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold tracking-wide">
          <Ban className="h-7 w-7" /> ตั้งค่าเลขไม่รับซื้อ
        </h1>

        {/* Add Form */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="เลขที่ไม่รับซื้อ"
            type="number"
            className="col-span-1 rounded-xl border border-transparent bg-white/20 py-2 px-4 text-white placeholder-slate-300 outline-none transition focus:border-emerald-400 focus:bg-white/30 focus:ring-2 focus:ring-emerald-400/50 sm:col-span-2"
          />
          <button
            onClick={addOrUpdateNumber}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2 font-semibold shadow-lg transition hover:bg-emerald-600 active:scale-95 sm:col-span-1"
          >
            <Plus className="h-5 w-5" /> {editingId ? "บันทึก" : "เพิ่มเลข"}
          </button>
        </div>

        {/* List */}
        {blacklist.length === 0 ? (
          <p className="text-center text-slate-300">ยังไม่มีเลขที่ถูกแบน</p>
        ) : (
          <ul className="space-y-3">
            {blacklist.map((item) => (
              <li
                key={item._id}
                className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <span className="font-medium">{item.number}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(item)}
                    className="rounded-md p-1 text-blue-300 transition hover:bg-white/20"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => removeNumber(item._id)}
                    className="rounded-md p-1 text-red-300 transition hover:bg-white/20"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
