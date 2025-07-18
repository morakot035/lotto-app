"use client";

import { useEffect, useState } from "react";
import { Plus, User, Trash2 } from "lucide-react";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { getToken } from "@/lib/auth";
import { useLoading } from "@/context/LoadingContext";

interface Buyers {
  _id: number;
  name: string;
  phone: string;
}

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyers[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const { showLoading, hideLoading } = useLoading();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = buyers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(buyers.length / itemsPerPage);

  useAuthGuard();

  const fetchBuyers = async () => {
    const token = getToken();
    if (!token) return;
    showLoading();
    try {
      const res = await apiClient.getBuyers(token);
      setBuyers(res.data);
    } catch (err) {
      console.error("โหลด buyers ล้มเหลว", err);
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    fetchBuyers();
  }, []);

  const addBuyer = async () => {
    if (!name.trim()) return;
    const token = getToken();
    if (!token) return;

    try {
      showLoading();

      const response = await apiClient.addBuyer({ name, phone }, token);
      const newBuyer = response.data;
      setBuyers((prev) => [...prev, newBuyer]);

      setName("");
      setPhone("");
    } catch (err) {
      console.error("เพิ่ม buyer ล้มเหลว", err);
    } finally {
      hideLoading();
    }
    setCurrentPage(1);
  };

  const removeBuyer = async (id: number) => {
    const token = getToken();
    if (!token) return;
    try {
      showLoading();
      await apiClient.deleteBuyer(id, token);

      setBuyers((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error("ลบ buyer ล้มเหลว", err);
    } finally {
      hideLoading();
    }
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
          <User className="h-7 w-7" /> รายชื่อผู้ซื้อ / คนเดินโพยหวย
        </h1>

        {/* Add Form */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อผู้ซื้อ / คนเดินโพย"
            className="col-span-1 rounded-xl border border-transparent bg-white/20 py-2 px-4 text-white placeholder-slate-300 outline-none transition focus:border-emerald-400 focus:bg-white/30 focus:ring-2 focus:ring-emerald-400/50 sm:col-span-1"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="เบอร์โทร (ไม่บังคับ)"
            className="col-span-1 rounded-xl border border-transparent bg-white/20 py-2 px-4 text-white placeholder-slate-300 outline-none transition focus:border-emerald-400 focus:bg-white/30 focus:ring-2 focus:ring-emerald-400/50 sm:col-span-1"
          />
          <button
            onClick={addBuyer}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2 font-semibold shadow-lg transition hover:bg-emerald-600 active:scale-95 sm:col-span-1"
          >
            <Plus className="h-5 w-5" /> เพิ่มรายชื่อ
          </button>
        </div>

        {/* List */}
        {currentItems.length === 0 ? (
          <p className="text-center text-slate-300">ยังไม่มีรายชื่อ</p>
        ) : (
          <ul className="space-y-3">
            {Array.isArray(currentItems) &&
              currentItems.map((b) => (
                <li
                  key={b._id}
                  className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
                >
                  <span className="font-medium">
                    {b.name}
                    {b.phone && (
                      <span className="ml-2 text-sm text-slate-300">
                        ({b.phone})
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => removeBuyer(b._id)}
                    className="rounded-md p-1 text-red-300 transition hover:bg-white/20"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
      {buyers.length > itemsPerPage && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-md bg-white/20 px-3 py-1 text-sm text-white transition hover:bg-white/30 disabled:opacity-50"
          >
            ย้อนกลับ
          </button>
          <span className="px-2 py-1 text-white/80">
            หน้า {currentPage} / {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="rounded-md bg-white/20 px-3 py-1 text-sm text-white transition hover:bg-white/30 disabled:opacity-50"
          >
            ถัดไป
          </button>
        </div>
      )}
    </section>
  );
}
