"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
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
        const res = await apiClient.updateBlacklist(
          editingId,
          { number },
          token
        );
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
    <section className="min-h-screen bg-gradient-to-br from-rose-50 to-emerald-100 px-4 py-12 text-gray-800">
      {/* Back Button */}
      <Link
        href="/Home"
        className="absolute top-6 left-6 rounded-lg bg-white/10 px-3 py-1 text-sm backdrop-blur-md transition hover:bg-white/20"
      >
        ← กลับหน้าเมนู
      </Link>

      <div className="mx-auto max-w-4xl space-y-10">
        {/* Card ตั้งค่าเลขไม่รับซื้อ */}
        <div className="rounded-2xl bg-white/80 p-6 shadow-xl ring-1 ring-white/40 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-rose-700 mb-6 text-center">
            🚫 ตั้งค่าเลขไม่รับซื้อ
          </h2>

          {/* Add Form */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="ระบุเลขที่ไม่รับซื้อ"
              type="number"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 bg-white text-gray-800 outline-none focus:ring-2 focus:ring-rose-400 shadow-sm"
            />
            <button
              onClick={addOrUpdateNumber}
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg px-6 py-2 transition active:scale-95 shadow"
            >
              <Plus className="inline-block w-4 h-4 mr-1" />
              {editingId ? "บันทึก" : "เพิ่มเลข"}
            </button>
          </div>

          {/* รายการเลขที่แบน */}
          {blacklist.length === 0 ? (
            <div className="text-center text-gray-400 italic">
              ยังไม่มีเลขที่ถูกแบน
            </div>
          ) : (
            <ul className="space-y-3">
              {blacklist.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center justify-between bg-white p-3 rounded-xl border shadow-sm hover:shadow-md transition"
                >
                  <span className="font-medium text-lg text-rose-700">
                    {item.number}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(item)}
                      className="text-blue-600 hover:text-blue-800 transition"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => removeNumber(item._id)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
